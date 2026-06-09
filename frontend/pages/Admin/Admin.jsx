import React, { useEffect, useMemo, useState } from 'react';
import './Admin.css';
import { adminService } from '../../services/adminService.js';

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

export default function Admin({
	homeContent,
	categories = [],
	products = [],
	orders = [],
	onUpdateHomeMessage,
	onMoveCarouselSlide,
	onToggleProductPriority,
	onToggleProductAvailability,
	onToggleFeatured,
	onSetCategoryOrder,
	onOpenProduct,
	onUpdateCarousel,
	onUpdateCategory,
}) {
	const [homeMessage, setHomeMessage] = useState(homeContent.fixedMessage);
	const [slideForm, setSlideForm] = useState(null);
	const [categoryForms, setCategoryForms] = useState({});
	const [editCategoryId, setEditCategoryId] = useState(null);

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

	const toApiSlide = (slide, orderIndex) => ({
		title: slide.title || '',
		subtitle: slide.text || '',
		image_url: slide.imageUrl || '',
		link_url: slide.categorySlug || '',
		order_index: orderIndex,
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
		onUpdateCategory?.(catId, { name: form.name, imageUrl: form.imageUrl });
		closeEditCategory();
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
		sorted.forEach((p, i) => {
			if (p.featuredRank !== i + 1) onToggleFeatured?.(p.id);
		});
	};

	return (
		<section className="page admin-page">
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

			<div className="admin-sections">

				{/* ── Message fixe ─────────────────────────────────────────── */}
				<article className="card stack">
					<h3>Message fixe (sous le carrousel)</h3>
					<textarea className="textarea" rows="3" value={homeMessage} onChange={(e) => setHomeMessage(e.target.value)} />
					<div className="page-actions">
						<button className="btn btn--primary" type="button" onClick={async () => {
							try { await adminService.updateHomepage(homeMessage); } catch (e) { console.warn('[admin] updateHomepage error:', e.message); }
							onUpdateHomeMessage(homeMessage);
						}}>
							Enregistrer le message
						</button>
					</div>
				</article>

				{/* ── Carrousel ────────────────────────────────────────────── */}
				<article className="card stack">
					<div className="inline-actions" style={{ justifyContent: 'space-between' }}>
						<h3 style={{ margin: 0 }}>Carrousel d'accueil ({homeContent.carousel.length} section(s))</h3>
						<button className="btn btn--primary" type="button" onClick={openAddSlide}>
							+ Ajouter une section
						</button>
					</div>

					{/* Formulaire ajout / édition slide */}
					{slideForm && (
						<div className="panel stack" style={{ marginTop: 16 }}>
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
									<button className="btn btn--secondary" type="button" onClick={() => onMoveCarouselSlide(slide.id, 'up')} disabled={index === 0} aria-label="Monter">↑</button>
									<button className="btn btn--secondary" type="button" onClick={() => onMoveCarouselSlide(slide.id, 'down')} disabled={index === homeContent.carousel.length - 1} aria-label="Descendre">↓</button>
									<button className="btn btn--secondary" type="button" onClick={() => openEditSlide(slide)}>Modifier</button>
									<button
										className="btn btn--secondary"
										type="button"
										style={{ color: 'var(--color-danger, #c0392b)' }}
										onClick={() => handleDeleteSlide(slide.id)}
									>
										Supprimer
									</button>
								</div>
							</div>
						))}
					</div>
				</article>

				{/* ── Catégories ───────────────────────────────────────────── */}
				<article className="card stack">
					<h3>Catégories (image, nom, ordre d'affichage)</h3>
					<div className="table-like">
						{categories.map((cat) => (
							<div key={cat.id} className="table-like__row" style={{ flexWrap: 'wrap', gap: 12 }}>
								{cat.imageUrl && (
									<img src={cat.imageUrl} alt={cat.name} style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
								)}
								<div style={{ flex: 1, minWidth: 120 }}>
									<strong>{cat.name}</strong>
									{cat.slug && <p className="helper-text" style={{ margin: 0 }}>/{cat.slug}</p>}
								</div>
								{editCategoryId === cat.id ? (
									<div className="stack" style={{ flex: '1 1 300px' }}>
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
									<div className="inline-actions" style={{ flexShrink: 0 }}>
										<span className="helper-text">Ordre : </span>
										<input
											className="input"
											type="number"
											min="1"
											style={{ width: 64 }}
											value={cat.displayOrder ?? 1}
											onChange={(e) => onSetCategoryOrder(cat.id, e.target.value)}
										/>
										<button className="btn btn--secondary" type="button" onClick={() => openEditCategory(cat)}>Modifier</button>
									</div>
								)}
							</div>
						))}
					</div>
				</article>

				{/* ── Top produits du moment ───────────────────────────────── */}
				<article className="card stack">
					<h3>Top produits du moment ({featuredProducts.length} sélectionné(s))</h3>
					<p className="helper-text">Les produits ci-dessous apparaissent sur la page d'accueil. Utilisez les flèches pour réordonner.</p>

					{featuredProducts.length > 0 && (
						<div className="table-like">
							{featuredProducts.map((p, idx) => (
								<div className="table-like__row" key={p.id} style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
									{p.image && <img src={p.image} alt={p.name} style={{ width: 52, height: 40, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
									<div style={{ flex: 1 }}>
										<strong>#{idx + 1} {p.name}</strong>
										<p className="helper-text" style={{ margin: 0 }}>{p.availableStock > 0 ? `${p.availableStock} en stock` : 'Rupture'}</p>
									</div>
									<div className="inline-actions" style={{ flexShrink: 0 }}>
										<button className="btn btn--secondary" type="button" onClick={() => moveFeatured(p.id, 'up')} disabled={idx === 0} aria-label="Monter">↑</button>
										<button className="btn btn--secondary" type="button" onClick={() => moveFeatured(p.id, 'down')} disabled={idx === featuredProducts.length - 1} aria-label="Descendre">↓</button>
										<button className="btn btn--secondary" type="button" style={{ color: 'var(--color-danger, #c0392b)' }} onClick={() => onToggleFeatured(p.id)}>
											Retirer
										</button>
									</div>
								</div>
							))}
						</div>
					)}

					<h4 style={{ marginTop: 16 }}>Ajouter un produit aux top produits</h4>
					<div className="table-like">
						{products.filter((p) => p.featuredRank <= 0).slice(0, 30).map((p) => (
							<div className="table-like__row" key={p.id} style={{ alignItems: 'center', gap: 12 }}>
								{p.image && <img src={p.image} alt={p.name} style={{ width: 44, height: 36, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
								<div style={{ flex: 1 }}>
									<strong>{p.name}</strong>
									<p className="helper-text" style={{ margin: 0 }}>{p.availableStock > 0 ? `${p.availableStock} en stock` : 'Rupture'}</p>
								</div>
								<button className="btn btn--secondary" type="button" onClick={() => onToggleFeatured(p.id)}>
									+ Ajouter
								</button>
							</div>
						))}
					</div>
				</article>

				{/* ── Gestion stocks & priorités ────────────────────────────── */}
				<article className="card stack">
					<h3>Produits — priorité & disponibilité</h3>
					<div className="table-like">
						{products.slice(0, 50).map((product) => (
							<div className="table-like__row" key={product.id} style={{ flexWrap: 'wrap', gap: 10 }}>
								<div style={{ flex: 1, minWidth: 160 }}>
									<strong>{product.name}</strong>
									<p className="helper-text" style={{ margin: 0 }}>{product.availableStock > 0 ? `${product.availableStock} en stock` : 'Rupture'}</p>
								</div>
								<div className="inline-actions" style={{ flexShrink: 0 }}>
									<button className="btn btn--secondary" type="button" onClick={() => onToggleProductPriority(product.id)}>
										{product.priorityRank > 0 ? 'Retirer priorité' : 'Prioritaire'}
									</button>
									<button className="btn btn--secondary" type="button" onClick={() => onToggleProductAvailability(product.id)}>
										{product.availableStock > 0 ? 'Passer en rupture' : 'Remettre en stock'}
									</button>
								</div>
							</div>
						))}
					</div>
				</article>

			</div>
		</section>
	);
}
