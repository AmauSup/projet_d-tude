import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Admin.css';
import { adminService } from '../services/adminService.js';
import { createEventSource } from '../../frontend/services/apiClient.js';

// Valeurs initiales d'une nouvelle diapositive de carrousel.
// Utilisé à chaque clic sur "+ Ajouter une section" pour repartir d'un formulaire vide.
const EMPTY_SLIDE = {
	id: '',
	title: '',
	text: '',
	badge: '',
	imageUrl: '',
	ctaLabel: 'Voir la catégorie',
	categorySlug: '',
};

// Génère un identifiant temporaire unique pour une slide créée localement
// avant sa persistance en base (l'id numérique est ensuite remplacé par l'id backend).
// Format : "slide-<timestamp>-<5 chars aléatoires>"
function genId() {
	return `slide-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Convertit un objet catégorie retourné par l'API admin (snake_case)
// vers le format camelCase utilisé par le frontend.
// Nécessaire car l'API storefront et l'API admin retournent des formats différents :
//   storefront → imageUrl, displayOrder
//   admin      → image_url, order_index
// Paramètres :
//   c (object) — catégorie brute de l'API admin
// Retourne :
//   (object) — catégorie normalisée avec imageUrl et displayOrder
function normalizeAdminCat(c) {
	return {
		...c,
		imageUrl: c.image_url || c.imageUrl || '',
		displayOrder: c.order_index ?? c.displayOrder ?? 0,
	};
}

// Composant principal de gestion de la page d'accueil (carrousel, catégories, top produits).
// Reçoit les données du storefront via les props et délègue les mutations à App.jsx
// via des callbacks (onUpdate*, onToggle*…).
// Paramètres (props) :
//   homeContent              (object)   — { carousel: Slide[], fixedMessage: string }
//   categories               (array)    — catégories visibles du storefront (depuis App.jsx)
//   products                 (array)    — tous les produits normalisés
//   orders                   (array)    — toutes les commandes
//   onUpdateHomeMessage      (function) — persiste le message fixe de l'accueil
//   onToggleProductPriority  (function) — bascule la priorité d'un produit
//   onToggleProductAvailability (function) — bascule la disponibilité d'un produit
//   onToggleFeatured         (function) — bascule / retire le statut "mis en avant"
//   onSetProductFeaturedRank (function) — définit le rang précis d'un produit en avant
//   onSetCategoryOrder       (function) — met à jour l'ordre d'une catégorie côté storefront
//   onOpenProduct            (function) — ouvre la fiche produit (navigation)
//   onUpdateCarousel         (function) — remplace le carrousel complet dans App.jsx
//   onUpdateCategory         (function) — met à jour une catégorie dans App.jsx
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
	const [homeMessage, setHomeMessage] = useState(homeContent.fixedMessage); // Message fixe en cours d'édition
	const [slideForm, setSlideForm] = useState(null);        // Données de la slide en cours d'édition (null = formulaire fermé)
	const [categoryForms, setCategoryForms] = useState({});  // { [catId]: { name, imageUrl } } — formulaires inline d'édition catégorie
	const [editCategoryId, setEditCategoryId] = useState(null); // Id de la catégorie dont le formulaire inline est ouvert

	// Catégories chargées via l'API ADMIN (pas storefront).
	// Différence cruciale : l'API storefront filtre les catégories masquées (visible=false),
	// l'API admin les retourne toutes → l'admin peut voir et réactiver une catégorie cachée.
	const [adminCats, setAdminCats] = useState([]);

	// useCallback stabilise la référence de la fonction entre les rendus.
	// C'est indispensable car elle est utilisée comme dépendance du useEffect SSE ci-dessous.
	// Sans useCallback, une nouvelle fonction serait créée à chaque rendu,
	// ce qui déclencherait la reconnexion SSE en boucle infinie.
	const loadAdminCats = useCallback(() => {
		adminService.listCategories()
			.then((cats) => setAdminCats(cats.map(normalizeAdminCat)))
			.catch(() => {});
	}, []);

	// Chargement initial + abonnement SSE.
	// Dès qu'un admin fait une modification (dans n'importe quel onglet/session),
	// le backend diffuse un événement SSE → on recharge les catégories silencieusement.
	// Le cleanup ferme proprement l'EventSource à la destruction du composant.
	useEffect(() => {
		loadAdminCats();
		const es = createEventSource('/pg/events/home');
		es.onmessage = () => loadAdminCats();
		return () => es.close();
	}, [loadAdminCats]);

	// Resynchronise le champ "message fixe" quand homeContent est rechargé depuis l'API
	useEffect(() => {
		setHomeMessage(homeContent.fixedMessage);
	}, [homeContent.fixedMessage]);

	// Métriques rapides affichées dans les cartes en haut de la page.
	// Calculées en useMemo pour éviter des recalculs à chaque rendu.
	const adminMetrics = useMemo(
		() => ({
			productsCount: products.length,                                            // Nombre total de produits
			availableCount: products.filter((p) => p.availableStock > 0).length,      // Produits en stock
			ordersCount: orders.length,                                                // Nombre de commandes
		}),
		[orders, products],
	);

	// ── Carrousel helpers ────────────────────────────────────────────────────────

	// Ouvre le formulaire pour une nouvelle slide (id généré localement)
	const openAddSlide = () => setSlideForm({ ...EMPTY_SLIDE, id: genId() });

	// Ouvre le formulaire pour modifier une slide existante (copie locale pour éviter la mutation directe)
	const openEditSlide = (slide) => setSlideForm({ ...slide });

	// Ferme le formulaire slide sans sauvegarder
	const closeSlideForm = () => setSlideForm(null);

	// Convertit une slide frontend (camelCase) vers le format attendu par l'API backend.
	// orderIndex est passé séparément car il change lors d'un déplacement
	// sans que les autres champs ne changent.
	// Paramètres :
	//   slide      (object) — slide frontend avec imageUrl, ctaLabel, etc.
	//   orderIndex (number) — position de la slide dans le carrousel
	// Retourne :
	//   (object) — payload API (snake_case) avec image_url, cta_label, etc.
	const toApiSlide = (slide, orderIndex) => ({
		title: slide.title || '',
		subtitle: slide.text || '',
		image_url: slide.imageUrl || '',
		link_url: slide.categorySlug || '',
		order_index: orderIndex,
		badge: slide.badge || '',
		cta_label: slide.ctaLabel || 'Voir la catégorie',
	});

	// Retourne true si l'id est un entier (id backend persisté en base).
	// Les ids temporaires sont des chaînes "slide-<timestamp>-<rand>" → false.
	// Paramètres :
	//   id (string | number) — identifiant à tester
	const isBackendId = (id) => /^\d+$/.test(String(id));

	// Sauvegarde la slide du formulaire (création ou mise à jour).
	// Crée une nouvelle slide si elle n'existe pas encore dans homeContent.carousel,
	// sinon met à jour la slide existante.
	// Après création, remplace l'id temporaire par l'id numérique renvoyé par le backend.
	const handleSaveSlide = async () => {
		if (!slideForm.title.trim()) return; // Titre obligatoire
		const existing = homeContent.carousel.find((s) => s.id === slideForm.id);
		let updatedCarousel;
		if (existing) {
			// Mode édition : remplace la slide dans le tableau
			updatedCarousel = homeContent.carousel.map((s) => (s.id === slideForm.id ? slideForm : s));
			if (isBackendId(slideForm.id)) {
				try {
					await adminService.updateCarouselSlide(slideForm.id, toApiSlide(slideForm, homeContent.carousel.indexOf(existing)));
				} catch (e) {
					console.warn('[admin] updateCarouselSlide error:', e.message);
				}
			}
		} else {
			// Mode création : ajoute la slide en fin de tableau
			updatedCarousel = [...homeContent.carousel, slideForm];
			try {
				const created = await adminService.createCarouselSlide(toApiSlide(slideForm, updatedCarousel.length - 1));
				// Remplace l'id temporaire par l'id numérique du backend
				if (created?.id) {
					updatedCarousel = updatedCarousel.map((s) => s.id === slideForm.id ? { ...s, id: String(created.id) } : s);
				}
			} catch (e) {
				console.warn('[admin] createCarouselSlide error:', e.message);
			}
		}
		onUpdateCarousel?.(updatedCarousel); // Notifie App.jsx pour mettre à jour le state global
		closeSlideForm();
	};

	// Supprime une slide du carrousel après confirmation.
	// Si l'id est un id backend, appelle l'API pour la supprimer en base.
	// Les slides temporaires (jamais persistées) sont simplement retirées du tableau.
	// Paramètres :
	//   slideId (string | number) — id de la slide à supprimer
	const handleDeleteSlide = async (slideId) => {
		if (!globalThis.confirm('Supprimer cette section du carrousel ?')) return;
		if (isBackendId(slideId)) {
			try {
				await adminService.deleteCarouselSlide(slideId);
			} catch (e) {
				console.warn('[admin] deleteCarouselSlide error:', e.message);
			}
		}
		onUpdateCarousel?.(homeContent.carousel.filter((s) => s.id !== slideId));
	};

	// ── Catégorie helpers ────────────────────────────────────────────────────────

	// Ouvre le formulaire inline d'édition d'une catégorie dans le panneau d'accueil.
	// Paramètres :
	//   cat (object) — catégorie admin à éditer
	const openEditCategory = (cat) => {
		setCategoryForms((prev) => ({ ...prev, [cat.id]: { name: cat.name, imageUrl: cat.imageUrl || '' } }));
		setEditCategoryId(cat.id);
	};

	// Ferme le formulaire inline sans sauvegarder
	const closeEditCategory = () => {
		setEditCategoryId(null);
	};

	// Sauvegarde les modifications d'une catégorie depuis le formulaire inline.
	// Met à jour adminCats (état local admin) ET notifie App.jsx via onUpdateCategory.
	// Paramètres :
	//   catId (number) — identifiant de la catégorie à sauvegarder
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
		// Mise à jour locale : image_url ET imageUrl pour garder la cohérence entre les deux formats
		setAdminCats((prev) => prev.map((c) => c.id === catId ? { ...c, name: form.name, imageUrl: form.imageUrl, image_url: form.imageUrl } : c));
		onUpdateCategory?.(catId, { name: form.name, imageUrl: form.imageUrl });
		closeEditCategory();
	};

	// ── Visibilité carrousel ─────────────────────────────────────────────────────

	// Bascule la visibilité d'une diapositive (visible ↔ masqué sur le storefront).
	// Mise à jour locale immédiate (UX fluide) via onUpdateCarousel, puis PATCH backend.
	// La slide reste visible dans l'interface admin même quand elle est masquée côté public.
	// Paramètres :
	//   slideId (string | number) — id de la diapositive à basculer
	const handleToggleCarouselVisible = async (slideId) => {
		const slide = homeContent.carousel.find((s) => s.id === slideId);
		if (!slide) return;
		const newVisible = slide.visible === false; // false → true, true/undefined → false
		onUpdateCarousel?.(homeContent.carousel.map((s) => s.id === slideId ? { ...s, visible: newVisible } : s));
		if (isBackendId(slideId)) {
			try {
				await adminService.setCarouselSlideVisible(slideId, newVisible);
			} catch (e) {
				console.warn('[admin] setCarouselSlideVisible error:', e.message);
			}
		}
	};

	// ── Visibilité catégories ────────────────────────────────────────────────────

	// Bascule la visibilité d'une catégorie (visible ↔ masqué sur le storefront).
	// Met à jour setAdminCats (état local qui inclut les masquées)
	// ET notifie App.jsx via onUpdateCategory (synchronisation du state global storefront).
	// Paramètres :
	//   catId (number) — identifiant de la catégorie
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

	// ── Déplacement de diapositive avec persistance DB ───────────────────────────

	// Déplace une slide dans le carrousel (haut/bas) puis persiste l'ordre en base.
	// Mise à jour locale immédiate via onUpdateCarousel pour un effet instantané,
	// puis sauvegarde asynchrone de TOUTES les slides avec leur nouvel order_index
	// (un échange modifie deux index simultanément → on doit tout resauvegarder).
	// Paramètres :
	//   slideId   (string | number) — id de la slide à déplacer
	//   direction (string)          — 'up' ou 'down'
	const handleMoveAndSaveSlide = async (slideId, direction) => {
		const slides = [...homeContent.carousel];
		const index = slides.findIndex((s) => s.id === slideId);
		const targetIndex = direction === 'up' ? index - 1 : index + 1;
		if (index < 0 || targetIndex < 0 || targetIndex >= slides.length) return;
		[slides[index], slides[targetIndex]] = [slides[targetIndex], slides[index]]; // Échange
		onUpdateCarousel?.(slides); // Mise à jour immédiate de l'affichage

		// Persistance en base pour toutes les slides ayant un id backend
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

	// ── Ordre des catégories ─────────────────────────────────────────────────────

	// Catégories admin triées par order_index pour l'affichage.
	// useMemo évite de retrier à chaque rendu si adminCats n'a pas changé.
	const sortedAdminCats = useMemo(
		() => [...adminCats].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)),
		[adminCats],
	);

	// Réordonne les catégories (haut/bas) et persiste en base.
	// Échange deux catégories adjacentes, réassigne des index séquentiels 0,1,2…,
	// puis sauvegarde en parallèle (Promise.all) et notifie App.jsx.
	// Paramètres :
	//   catId (number) — identifiant de la catégorie à déplacer
	//   dir   (string) — 'up' ou 'down'
	const handleMoveCategoryOrder = async (catId, dir) => {
		const idx = sortedAdminCats.findIndex((c) => c.id === catId);
		const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
		if (idx < 0 || targetIdx < 0 || targetIdx >= sortedAdminCats.length) return;
		const reordered = [...sortedAdminCats];
		[reordered[idx], reordered[targetIdx]] = [reordered[targetIdx], reordered[idx]];
		const withIdx = reordered.map((c, i) => ({ ...c, order_index: i })); // Réindexation
		setAdminCats(withIdx);
		withIdx.forEach((c) => onSetCategoryOrder(c.id, c.order_index)); // Notifie App.jsx
		try {
			await Promise.all(withIdx.map((c) => adminService.updateCategory(c.id, { order_index: c.order_index })));
		} catch (e) {
			console.warn('[admin] updateCategory order error:', e.message);
		}
	};

	// ── Top produits ─────────────────────────────────────────────────────────────

	// Produits "mis en avant" : filtrés (featuredRank > 0) et triés par rang croissant.
	// Affichés dans le panneau "Top produits" de la page d'accueil.
	const featuredProducts = useMemo(
		() => [...products].filter((p) => p.featuredRank > 0).sort((a, b) => a.featuredRank - b.featuredRank),
		[products],
	);

	// Déplace un produit dans la liste "top produits" (haut/bas).
	// Réassigne des rangs consécutifs (1, 2, 3…) après l'échange,
	// puis persiste via onSetProductFeaturedRank ou onToggleFeatured.
	// Paramètres :
	//   productId (number) — identifiant du produit à déplacer
	//   direction (string) — 'up' ou 'down'
	const moveFeatured = (productId, direction) => {
		const sorted = [...featuredProducts];
		const idx = sorted.findIndex((p) => p.id === productId);
		const target = direction === 'up' ? idx - 1 : idx + 1;
		if (idx < 0 || target < 0 || target >= sorted.length) return;
		[sorted[idx], sorted[target]] = [sorted[target], sorted[idx]];
		// Réassigne les rangs et persiste uniquement les produits dont le rang a changé
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

			{/* Cartes de métriques rapides */}
			<div className="metric-grid" style={{ marginBottom: 28 }}>
				<article className="metric-card"><h3>Produits</h3><div className="metric-card__value">{adminMetrics.productsCount}</div></article>
				<article className="metric-card"><h3>En stock</h3><div className="metric-card__value">{adminMetrics.availableCount}</div></article>
				<article className="metric-card"><h3>Commandes</h3><div className="metric-card__value">{adminMetrics.ordersCount}</div></article>
				<article className="metric-card"><h3>Top produits</h3><div className="metric-card__value">{featuredProducts.length}</div></article>
			</div>

			<div className="admin-homepage-grid">

				{/* ── Ligne 1 : Carrousel (pleine largeur) ────────────────────── */}
				<article className="card stack admin-homepage-full">
					<div className="inline-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
						<h3 style={{ margin: 0 }}>Carrousel d'accueil ({homeContent.carousel.length} section(s))</h3>
						<button className="btn btn--primary" type="button" onClick={openAddSlide}>
							+ Ajouter une section
						</button>
					</div>

					{/* Message fixe sous le carrousel */}
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

					{/* Formulaire ajout / édition slide — visible quand slideForm !== null */}
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

					{/* Liste des slides existantes avec actions de déplacement, visibilité, édition, suppression */}
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
									{/* ↑ désactivé si la slide est déjà la première */}
									<button className="btn btn--secondary" type="button" onClick={() => handleMoveAndSaveSlide(slide.id, 'up')} disabled={index === 0} aria-label="Monter">↑</button>
									{/* ↓ désactivé si la slide est déjà la dernière */}
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

				{/* ── Ligne 2 gauche : Catégories ─────────────────────────────── */}
				<article className="card stack">
					<h3>Catégories (image, nom, ordre d'affichage)</h3>
					<div className="table-like">
						{sortedAdminCats.map((cat, idx) => (
							<div key={cat.id} className="table-like__row" style={{ gap: 8, alignItems: 'center' }}>
								{/* Boutons ▲ / ▼ pour réordonner */}
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
								{/* Bouton visibilité : rouge = masqué, secondaire = visible */}
								<button
									className={`btn ${cat.visible === false ? 'btn--danger' : 'btn--secondary'}`}
									type="button"
									style={{ fontSize: '0.75rem', padding: '2px 8px', flexShrink: 0 }}
									onClick={() => handleToggleCategoryVisible(cat.id)}
								>
									{cat.visible === false ? 'Masqué' : 'Visible'}
								</button>
								{/* Formulaire inline d'édition nom / image — affiché pour la catégorie sélectionnée */}
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

				{/* ── Ligne 2 droite : Top produits du moment ─────────────────── */}
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

				{/* ── Ligne 3 gauche : Ajouter des top produits ───────────────── */}
				<article className="card stack">
					<h3>Ajouter un produit aux top produits</h3>
					<p className="helper-text">Produits non encore sélectionnés ({products.filter((p) => p.featuredRank <= 0).length} disponibles).</p>
					<div className="table-like">
						{/* Limité à 30 pour éviter un trop long défilement */}
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

				{/* ── Ligne 3 droite : Priorité et disponibilité des produits ── */}
				<article className="card stack">
					<h3>Produits — priorité &amp; disponibilité</h3>
					<p className="helper-text">{products.length} produit(s) au total.</p>
					<div className="table-like">
						{/* Limité à 50 pour éviter un trop long défilement */}
						{products.slice(0, 50).map((product) => (
							<div className="table-like__row" key={product.id} style={{ alignItems: 'center', gap: 8 }}>
								<div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
									<strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{product.name}</strong>
									<p className="helper-text" style={{ margin: 0, whiteSpace: 'nowrap' }}>{product.availableStock > 0 ? `${product.availableStock} en stock` : 'Rupture'}</p>
								</div>
								<div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
									{/* Toggle priorité : "Prioritaire" si rang = 0, "Retirer priorité" si déjà prioritaire */}
									<button className="btn btn--secondary" type="button" style={{ fontSize: '0.78rem', padding: '2px 8px' }} onClick={() => onToggleProductPriority(product.id)}>
										{product.priorityRank > 0 ? 'Retirer priorité' : 'Prioritaire'}
									</button>
									{/* Toggle disponibilité : simule rupture ou retour en stock */}
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
