import React from 'react';
import './Pagination.css';

export default function Pagination({ page, totalPages, onPageChange }) {
	if (totalPages <= 1) return null;

	const pages = [];
	const delta = 2;
	const left = Math.max(1, page - delta);
	const right = Math.min(totalPages, page + delta);

	if (left > 1) {
		pages.push(1);
		if (left > 2) pages.push('…');
	}
	for (let i = left; i <= right; i++) pages.push(i);
	if (right < totalPages) {
		if (right < totalPages - 1) pages.push('…');
		pages.push(totalPages);
	}

	return (
		<nav className="pagination" aria-label="Pagination">
			<button
				type="button"
				className="pagination__btn"
				disabled={page <= 1}
				onClick={() => onPageChange(page - 1)}
				aria-label="Page précédente"
			>
				‹
			</button>

			{pages.map((p, i) =>
				p === '…' ? (
					<span key={`ellipsis-${i}`} className="pagination__ellipsis">…</span>
				) : (
					<button
						key={p}
						type="button"
						className={`pagination__btn ${p === page ? 'is-active' : ''}`}
						onClick={() => onPageChange(p)}
						aria-current={p === page ? 'page' : undefined}
					>
						{p}
					</button>
				),
			)}

			<button
				type="button"
				className="pagination__btn"
				disabled={page >= totalPages}
				onClick={() => onPageChange(page + 1)}
				aria-label="Page suivante"
			>
				›
			</button>
		</nav>
	);
}
