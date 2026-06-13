import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Admin.css';
import { adminService } from '../../services/adminService.js';
import { createEventSource } from '../../services/apiClient.js';

const EMPTY_SLIDE = {
	id: '',
	title: '',
	text: '',
	badge: '',
	imageUrl: '',
	ctaLabel: 'Voir la catégorie',
	categorySlug: '',
};

function genId() {
	return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Convertit un objet catégorie retourné par l'API admin (snake_case)
// vers le format camelCase utilisé par le frontend.
// Nécessaire car l'API storefront et l'API admin retournent des formats différents :
// storefront → imageUrl, displayOrder | admin → image_url, order_index
function normalizeAdminCat(c) {
	return {
		...c,
		imageUrl: c.image_url || c.imageUrl || '',
		displayOrder: c.order_index ?? c.displayOrder ?? 0,
	};
}

export default function Admin({
	homeContent,
	categories = [],
	products = [],
	orders = [],
	onUpdateHomeMessage,
	onToggleProductPriority,
	onToggleProductAvailability,
	onToggleFeatured,
	onSetProductFeaturedRank,
	onSetCategoryOrder,
	onOpenProduct,
	onUpdateCarousel,
	onUpdateCategory,
}) {
	const [homeMessage, setHomeMessage] = useState(homeContent.fixedMessage);
	const [slideForm, setSlideForm] = useState(null);
	const [categoryForms, setCategoryForms] = useState({});
	const [editCategoryId, setEditCategoryId] = useState(null);

	// Les catégories chargées via l'API ADMIN (pas storefront).
	// Différence cruciale : l'API storefront filtre les catégories masquées (visible=false),
	// l'API admin les retourne toutes → l'admin peut voir et réactiver une catégorie cachée.
	const [adminCats, setAdminCats] = useState([]);

	// useCallback stabilise la référence de la fonction entre les rendus,
	// indispensable car elle est utilisée comme dépendance du useEffect SSE.
	// Sans useCallback, une nouvelle fonction serait créée à chaque rendu,
	// ce qui déclencherait la reconnexion SSE en boucle infinie.
	const loadAdminCats = useCallback(() => {
		adminService.listCategories()
			.then((cats) => setAdminCats(cats.map(normalizeAdminCat)))
			.catch(() => {});
	}, []);

	// Abonnement SSE (Server-Sent Events) : dès qu'un admin fait une modification,
	// le backend diffuse un événement → on recharge les catégories admin silencieusement.
	// L'EventSource se ferme proprement à la destruction du composant (cleanup),
	// évitant ainsi les fuites mémoire et les mises à jour sur un composant démonté.
	useEffect(() => {
		loadAdminCats();
		const es = createEventSource('/pg/events/home');
		es.onmessage = () => loadAdminCats();
		return () => es.close();
	}, [loadAdminCats]);

	useEffect(() => {
		setHomeMessage(homeContent.fixedMessage);
	}, [homeContent.fixedMessage]);

	const adminMetrics = useMemo(
		() => ({
			productsCount: products.length,
			availableCount: products.filter((p) => p.availableStock > 0).length,
			ordersCount: orders.length,
		}),
		[orders, products],
	);

	// ── Carrousel helpers ───────────────────────────────────────────────────────

	const openAddSlide = () => setSlideForm({ ...EMPTY_SLIDE, id: genId() });
	const openEditSlide = (slide) => setSlideForm({ ...slide });
	const closeSlideForm = () => setSlideForm(null);

	// Convertit un objet slide frontend (camelCase) vers le format attendu par l'API backend.
	// orderIndex est passé séparément pour permettre la persistance de l'ordre :
	// lors d'un déplacement, l'index change mais le reste de la slide ne change pas.
	const toApiSlide = (slide, orderIndex) => ({
		title: slide.title || '',
		subtitle: slide.text || '',
		image_url: slide.imageUrl || '',
		link_url: slide.categorySlug || '',
		order_index: orderIndex,
		badge: slide.badge || '',
		cta_label: slide.ctaLabel || 'Voir la catégorie',
	});

	const isBackendId = (id) => /^\d+$/.test(String(id));

	const handleSaveSlide = async () => {
		if (!slideForm.title.trim()) return;
		const existing = homeContent.carousel.find((s) => s.id === slideForm.id);
		let updatedCarousel;
		if (existing) {
			updatedCarousel = homeContent.carousel.map((s) => (s.id === slideForm.id ? slideForm : s));
			if (isBackendId(slideForm.id)) {
				try {
					await adminService.updateCarouselSlide(slideForm.id, toApiSlide(slideForm, homeContent.carousel.indexOf(existing)));
				} catch (e) {
					console.warn('[admin] updateCarouselSlide error:', e.message);
				}
			}
		} else {
			updatedCarousel = [...homeContent.carousel, slideForm];
			try {
				const created = await adminService.createCarouselSlide(toApiSlide(slideForm, updatedCarousel.length - 1));
				if (created?.id) {
					updatedCarousel = updatedCarousel.map((s) => s.id === slideForm.id ? { ...s, id: String(created.id) } : s);
				}
			} catch (e) {
				console.warn('[admin] createCarouselSlide error:', e.message);
			}
		}
		onUpdateCarousel?.(updatedCarousel);
		closeSlideForm();
	};

	const handleDeleteSlide = async (slideId) => {
		if (!window.confirm('Supprimer cette section du carrousel ?')) return;
		if (isBackendId(slideId)) {
			try {
				await adminService.deleteCarouselSlide(slideId);
			} catch (e) {
				console.warn('[admin] deleteCarouselSlide error:', e.message);
			}
		}
		onUpdateCarousel?.(homeContent.carousel.filter((s) => s.id !== slideId));
	};

	// ── Catégorie helpers ───────────────────────────────────────────────────────

	const openEditCategory = (cat) => {
		setCategoryForms((prev) => ({ ...prev, [cat.id]: { name: cat.name, imageUrl: cat.imageUrl || '' } }));
		setEditCategoryId(cat.id);
	};

	const closeEditCategory = () => {
		setEditCategoryId(null);
	};

	const handleSaveCategory = async (catId) => {
		const form = categoryForms[catId];
		if (!form) return;
		if (isBackendId(catId)) {
			try {
				await adminService.updateCategory(catId, { name: form.name, image_url: form.imageUrl });
			} catch (e) {
				console.warn('[admin] updateCategory error:', e.message);
			}
		}
		setAdminCats((prev) => prev.map((c) => c.id === catId ? { ...c, name: form.name, imageUrl: form.imageUrl, image_url: form.imageUrl } : c));
		onUpdateCategory?.(catId, { name: form.name, imageUrl: form.imageUrl });
		closeEditCategory();
	};

	// ── Visibilité carrousel ────────────────────────────────────────────────────

	// Bascule la visibilité d'une diapositive du carrousel.
	// Mise à jour locale immédiate (UX fluide), puis PATCH vers le backend.
	// La diapositive reste visible dans l'interface admin même quand elle est masquée
	// sur le site public (storefront) : l'admin garde le contrôle total.
	const handleToggleCarouselVisible = async (slideId) => {
		const slide = homeContent.carousel.find((s) => s.id === slideId);
		if (!slide) return;
		const newVisible = slide.visible === false;
		onUpdateCarousel?.(homeContent.carousel.map((s) => s.id === slideId ? { ...s, visible: newVisible } : s));
		if (isBackendId(slideId)) {
			try {
				await adminService.setCarouselSlideVisible(slideId, newVisible);
			} catch (e) {
				console.warn('[admin] setCarouselSlideVisible error:', e.message);
			}
		}
	};

	// ── Visibilité catégories ───────────────────────────────────────────────────

	// Même principe que le toggle carousel, mais pour les catégories.
	// Utilise setAdminCats pour mettre à jour l'état local admin (pas le prop storefront)
	// et onUpdateCategory pour notifier App.jsx (synchronisation du state global).
	// Les deux états sont distincts : adminCats inclut les masquées, categories (storefront) non.
	const handleToggleCategoryVisible = async (catId) => {
		const cat = adminCats.find((c) => c.id === catId);
		if (!cat) return;
		const newVisible = cat.visible === false;
		setAdminCats((prev) => prev.map((c) => c.id === catId ? { ...c, visible: newVisible } : c));
		onUpdateCategory?.(catId, { visible: newVisible });
		if (isBackendId(catId)) {
			try {
				await adminService.setCategoryVisible(catId, newVisible);
			} catch (e) {
				console.warn('[admin] setCategoryVisible error:', e.message);
			}
		}
	};

	// ── Déplacement de diapositive avec persistance DB ─────────────────────────

	// Déplace une diapositive dans le carrousel (haut/bas) puis persiste l'ordre en base.
	// Mise à jour locale immédiate via onUpdateCarousel pour un effet instantané (pas d'attente réseau),
	// puis sauvegarde asynchrone de TOUTES les diapositives avec leur nouvel order_index.
	// On doit sauvegarder toutes les slides car l'échange modifie deux index simultanément.
	const handleMoveAndSaveSlide = async (slideId, direction) => {
		const slides = [...homeContent.carousel];
		const index = slides.findIndex((s) => s.id === slideId);
		const targetIndex = direction === 'up' ? index - 1 : index + 1;
		if (index < 0 || targetIndex < 0 || targetIndex >= slides.length) return;
		[slides[index], slides[targetIndex]] = [slides[targetIndex], slides[index]];

		// Mise à jour immédiate de la page d'accueil (temps réel)
		onUpdateCarousel?.(slides);

		// Persistance en base pour les diapositives backend
		for (let i = 0; i < slides.length; i++) {
			const s = slides[i];
			if (isBackendId(s.id)) {
				try {
					await adminService.updateCarouselSlide(s.id, toApiSlide(s, i));
				} catch (e) {
					console.warn('[admin] update carousel order:', e.message);
				}
			}
		}
	};

	// ── Ordre des catégories (données admin, inclut les masquées) ──────────────

	const sortedAdminCats = useMemo(
		() => [...adminCats].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
		[adminCats],
	);

	// Réordonne les catégories par échange de deux éléments adjacents.
	// Réassigne des index séquentiels 0,1,2... sur le tableau réordonné,
	// puis sauvegarde en base et notifie App.jsx pour mettre à jour le storefront.
	// Promise.all permet d'envoyer tous les PATCH en parallèle plutôt qu'en séquence.
	const handleMoveCategoryOrder = async (catId, dir) => {
		const idx = sortedAdminCats.findIndex((c) => c.id === catId);
		const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
		if (idx < 0 || targetIdx < 0 || targetIdx >= sortedAdminCats.length) return;
		const reordered = [...sortedAdminCats];
		[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
		const withIdx = reordered.map((c, i) => ({ ...c, order_index: i }));
		setAdminCats(withIdx);
		withIdx.forEach((c) => onSetCategoryOrder(c.id, c.order_index));
		try {
			await Promise.all(withIdx.map((c) => adminService.updateCategory(c.id, { order_index: c.order_index })));
		} catch (e) {
			console.warn('[admin] updateCategory order error:', e.message);
		}
	};

	// ── Top produits helpers ────────────────────────────────────────────────────

	const featuredProducts = useMemo(
		() => [...products].filter((p) => p.featuredRank > 0).sort((a, b) => a.featuredRank - b.featuredRank),
		[products],
	);

	const moveFeatured = (productId, direction) => {
		const sorted = [...featuredProducts];
		const idx = sorted.findIndex((p) => p.id === productId);
		const target = direction === 'up' ? idx - 1 : idx + 1;
		if (idx < 0 || target < 0 || target >= sorted.length) return;
		[sorted[idx], sorted[target]] = [sorted[target], sorted[idx]];
		// Réassigne des rangs consécutifs et persiste en base
		sorted.forEach((p, i) => {
			const newRank = i + 1;
			if (p.featuredRank !== newRank) {
				(onSetProductFeaturedRank ?? onToggleFeatured)?.(p.id, newRank);
			}
		});
	};

	return (
		<>
			<header className="page__header">
				<h1 className="page__title">Gestion de la page d'accueil</h1>
				<p className="page__subtitle">Modifiez le carrousel, le message fixe, les catégories et les top produits.</p>
			</header>

			<div className="metric-grid" style={{ marginBottom: 28 }}>
				<article className="metric-card"><h3>Produits</h3><div className="metric-card__value">{adminMetrics.productsCount}</div></article>
				<article className="metric-card"><h3>En stock</h3><div className="metric-card__value">{adminMetrics.availableCount}</div></article>
				<article className="metric-card"><h3>Commandes</h3><div className="metric-card__value">{adminMetrics.ordersCount}</div></article>
				<article className="metric-card"><h3>Top produits</h3><div className="metric-card__value">{featuredProducts.length}</div></article>
			</div>

			<div className="admin-homepage-grid">

				{/* ── Ligne 1 : Carrousel (pleine largeur) ─────────────────── */}
				<article className="card stack admin-homepage-full">
					<div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
						<h3 style={{ margin: 0 }}>Carrousel d'accueil ({homeContent.carousel.length} section(s))</h3>
						<button className="btn btn--primary" type="button" onClick={openAddSlide}>
							+ Ajouter une section
						</button>
					</div>

					{/* Message fixe intégré */}
					<div className="panel stack" style={{ marginTop: 8 }}>
						<h4 style={{ margin: 0 }}>Message fixe (sous le carrousel)</h4>
						<textarea className="textarea" rows="2" value={homeMessage} onChange={(e) => setHomeMessage(e.target.value)} />
						<div>
							<button className="btn btn--primary" type="button" onClick={async () => {
								try { await adminService.updateHomepage(homeMessage); } catch (e) { console.warn('[admin] updateHomepage error:', e.message); }
								onUpdateHomeMessage(homeMessage);
							}}>
								Enregistrer le message
							</button>
						</div>
					</div>

					{/* Formulaire ajout / édition slide */}
					{slideForm && (
						<div className="panel stack" style={{ marginTop: 8 }}>
							<h4>{slideForm.id && homeContent.carousel.some((s) => s.id === slideForm.id) ? 'Modifier la section' : 'Nouvelle section'}</h4>
							<div className="form-grid">
								<div>
									<label className="form-label" htmlFor="slide-title">Titre *</label>
									<input id="slide-title" className="input" value={slideForm.title} onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })} />
								</div>
								<div>
									<label className="form-label" htmlFor="slide-badge">Badge / étiquette</label>
									<input id="slide-badge" className="input" value={slideForm.badge} onChange={(e) => setSlideForm({ ...slideForm, badge: e.target.value })} />
								</div>
								<div style={{ gridColumn: '1 / -1' }}>
									<label className="form-label" htmlFor="slide-text">Texte / description</label>
									<input id="slide-text" className="input" value={slideForm.text} onChange={(e) => setSlideForm({ ...slideForm, text: e.target.value })} />
								</div>
								<div style={{ gridColumn: '1 / -1' }}>
									<label className="form-label" htmlFor="slide-image">URL de l'image</label>
									<input id="slide-image" className="input" placeholder="https://…" value={slideForm.imageUrl} onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })} />
									{slideForm.imageUrl && (
										<img src={slideForm.imageUrl} alt="Aperçu" style={{ marginTop: 8, maxHeight: 100, borderRadius: 8, objectFit: 'cover' }} />
									)}
								</div>
								<div>
									<label className="form-label" htmlFor="slide-cta">Texte du bouton CTA</label>
									<input id="slide-cta" className="input" value={slideForm.ctaLabel} onChange={(e) => setSlideForm({ ...slideForm, ctaLabel: e.target.value })} />
								</div>
								<div>
									<label className="form-label" htmlFor="slide-cat">Slug catégorie cible</label>
									<select id="slide-cat" className="select" value={slideForm.categorySlug} onChange={(e) => setSlideForm({ ...slideForm, categorySlug: e.target.value })}>
										<option value="">— Aucune —</option>
										{categories.map((c) => (
											<option key={c.id} value={c.slug}>{c.name} ({c.slug})</option>
										))}
									</select>
								</div>
							</div>
							<div className="inline-actions">
								<button className="btn btn--secondary" type="button" onClick={closeSlideForm}>Annuler</button>
								<button className="btn btn--primary" type="button" onClick={handleSaveSlide} disabled={!slideForm.title.trim()}>Sauvegarder</button>
							</div>
						</div>
					)}

					{/* Liste des slides */}
					<div className="table-like">
						{homeContent.carousel.length === 0 && (
							<p className="helper-text">Aucune section dans le carrousel.</p>
						)}
						{homeContent.carousel.map((slide, index) => (
							<div className="table-like__row" key={slide.id} style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
								{slide.imageUrl && (
									<img src={slide.imageUrl} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
								)}
								<div style={{ flex: 1 }}>
									<strong>{index + 1}. {slide.title}</strong>
									{slide.text && <p className="helper-text" style={{ margin: 0 }}>{slide.text}</p>}
								</div>
								<div className="inline-actions" style={{ flexShrink: 0 }}>
									<button className="btn btn--secondary" type="button" onClick={() => handleMoveAndSaveSlide(slide.id, 'up')} disabled={index === 0} aria-label="Monter">↑</button>
									<button className="btn btn--secondary" type="button" onClick={() => handleMoveAndSaveSlide(slide.id, 'down')} disabled={index === homeContent.carousel.length - 1} aria-label="Descendre">↓</button>
									<button
										className={`btn ${slide.visible === false ? 'btn--danger' : 'btn--secondary'}`}
										type="button"
										style={{ fontSize: '0.8rem', padding: '2px 10px' }}
										onClick={() => handleToggleCarouselVisible(slide.id)}
									>
										{slide.visible === false ? 'Masqué' : 'Visible'}
									</button>
									<button className="btn btn--secondary" type="button" onClick={() => openEditSlide(slide)}>Modifier</button>
									<button className="btn btn--secondary" type="button" style={{ color: 'var(--color-danger, #c0392b)' }} onClick={() => handleDeleteSlide(slide.id)}>
										Supprimer
									</button>
								</div>
							</div>
						))}
					</div>
				</article>

				{/* ── Ligne 2 gauche : Catégories ──────────────────────────── */}
				<article className="card stack">
					<h3>Catégories (image, nom, ordre d'affichage)</h3>
					<div className="table-like">
						{sortedAdminCats.map((cat, idx) => (
							<div key={cat.id} className="table-like__row" style={{ gap: 8, alignItems: 'center' }}>
								<div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
									<button
										className="btn btn--secondary"
										type="button"
										style={{ padding: '2px 6px', lineHeight: 1, fontSize: '0.75rem' }}
										disabled={idx === 0}
										onClick={() => handleMoveCategoryOrder(cat.id, 'up')}
										aria-label="Monter"
									>▲</button>
									<button
										className="btn btn--secondary"
										type="button"
										style={{ padding: '2px 6px', lineHeight: 1, fontSize: '0.75rem' }}
										disabled={idx === sortedAdminCats.length - 1}
										onClick={() => handleMoveCategoryOrder(cat.id, 'down')}
										aria-label="Descendre"
									>▼</button>
								</div>
								{cat.imageUrl && (
									<img src={cat.imageUrl} alt={cat.name} style={{ width: 44, height: 34, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />
								)}
								<div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
									<strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{idx + 1}. {cat.name}</strong>
									{cat.slug && <p className="helper-text" style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>/{cat.slug}</p>}
								</div>
								<button
									className={`btn ${cat.visible === false ? 'btn--danger' : 'btn--secondary'}`}
									type="button"
									style={{ fontSize: '0.75rem', padding: '2px 8px', flexShrink: 0 }}
									onClick={() => handleToggleCategoryVisible(cat.id)}
								>
									{cat.visible === false ? 'Masqué' : 'Visible'}
								</button>
								{editCategoryId === cat.id ? (
									<div className="stack" style={{ flex: '1 1 100%' }}>
										<input
											className="input"
											placeholder="Nom de la catégorie"
											value={categoryForms[cat.id]?.name ?? cat.name}
											onChange={(e) => setCategoryForms((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], name: e.target.value } }))}
										/>
										<input
											className="input"
											placeholder="URL image"
											value={categoryForms[cat.id]?.imageUrl ?? ''}
											onChange={(e) => setCategoryForms((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], imageUrl: e.target.value } }))}
										/>
										<div className="inline-actions">
											<button className="btn btn--secondary" type="button" onClick={closeEditCategory}>Annuler</button>
											<button className="btn btn--primary" type="button" onClick={() => handleSaveCategory(cat.id)}>Sauvegarder</button>
										</div>
									</div>
								) : (
									<button className="btn btn--secondary" type="button" style={{ flexShrink: 0 }} onClick={() => openEditCategory(cat)}>Modifier</button>
								)}
							</div>
						))}
					</div>
				</article>

				{/* ── Ligne 2 droite : Top produits du moment ──────────────── */}
				<article className="card stack">
					<h3>Top produits du moment ({featuredProducts.length} sélectionné(s))</h3>
					<p className="helper-text">Ces produits apparaissent sur la page d'accueil. Utilisez les flèches pour réordonner.</p>
					{featuredProducts.length === 0 && (
						<p className="helper-text">Aucun top produit sélectionné.</p>
					)}
					<div className="table-like">
						{featuredProducts.map((p, idx) => (
							<div className="table-like__row" key={p.id} style={{ alignItems: 'center', gap: 8 }}>
								{p.image && <img src={p.image} alt={p.name} style={{ width: 44, height: 34, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />}
								<div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
									<strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>#{idx + 1} {p.name}</strong>
									<p className="helper-text" style={{ margin: 0, whiteSpace: 'nowrap' }}>{p.availableStock > 0 ? `${p.availableStock} en stock` : 'Rupture'}</p>
								</div>
								<div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
									<button className="btn btn--secondary" type="button" style={{ padding: '2px 6px', lineHeight: 1, fontSize: '0.75rem' }} onClick={() => moveFeatured(p.id, 'up')} disabled={idx === 0} aria-label="Monter">↑</button>
									<button className="btn btn--secondary" type="button" style={{ padding: '2px 6px', lineHeight: 1, fontSize: '0.75rem' }} onClick={() => moveFeatured(p.id, 'down')} disabled={idx === featuredProducts.length - 1} aria-label="Descendre">↓</button>
									<button className="btn btn--secondary" type="button" style={{ fontSize: '0.8rem', padding: '2px 8px', color: 'var(--color-danger, #c0392b)' }} onClick={() => onToggleFeatured(p.id)}>Retirer</button>
								</div>
							</div>
						))}
					</div>
				</article>

				{/* ── Ligne 3 gauche : Ajouter un produit aux top produits ─── */}
				<article className="card stack">
					<h3>Ajouter un produit aux top produits</h3>
					<p className="helper-text">Produits non encore sélectionnés ({products.filter((p) => p.featuredRank <= 0).length} disponibles).</p>
					<div className="table-like">
						{products.filter((p) => p.featuredRank <= 0).slice(0, 30).map((p) => (
							<div className="table-like__row" key={p.id} style={{ alignItems: 'center', gap: 8 }}>
								{p.image && <img src={p.image} alt={p.name} style={{ width: 44, height: 34, objectFit: 'cover', borderRadius: 5, flexShrink: 0 }} />}
								<div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
									<strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{p.name}</strong>
									<p className="helper-text" style={{ margin: 0, whiteSpace: 'nowrap' }}>{p.availableStock > 0 ? `${p.availableStock} en stock` : 'Rupture'}</p>
								</div>
								<button className="btn btn--secondary" type="button" style={{ flexShrink: 0, fontSize: '0.8rem', padding: '3px 10px' }} onClick={() => onToggleFeatured(p.id)}>
									+ Ajouter
								</button>
							</div>
						))}
					</div>
				</article>

				{/* ── Ligne 3 droite : Produits priorité & disponibilité ───── */}
				<article className="card stack">
					<h3>Produits — priorité & disponibilité</h3>
					<p className="helper-text">{products.length} produit(s) au total.</p>
					<div className="table-like">
						{products.slice(0, 50).map((product) => (
							<div className="table-like__row" key={product.id} style={{ alignItems: 'center', gap: 8 }}>
								<div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
									<strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{product.name}</strong>
									<p className="helper-text" style={{ margin: 0, whiteSpace: 'nowrap' }}>{product.availableStock > 0 ? `${product.availableStock} en stock` : 'Rupture'}</p>
								</div>
								<div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
									<button className="btn btn--secondary" type="button" style={{ fontSize: '0.78rem', padding: '2px 8px' }} onClick={() => onToggleProductPriority(product.id)}>
										{product.priorityRank > 0 ? 'Retirer priorité' : 'Prioritaire'}
									</button>
									<button className="btn btn--secondary" type="button" style={{ fontSize: '0.78rem', padding: '2px 8px' }} onClick={() => onToggleProductAvailability(product.id)}>
										{product.availableStock > 0 ? 'Rupture' : 'En stock'}
									</button>
								</div>
							</div>
						))}
					</div>
				</article>

			</div>
		</>
	);
}
