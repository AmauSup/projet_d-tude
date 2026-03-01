import React from 'react';

export default function Footer() {
	return (
		<footer style={{ borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
			<div style={{ maxWidth: 1100, margin: '0 auto', padding: '16px', fontSize: 13, color: '#6b7280' }}>
				© {new Date().getFullYear()} Althea Systems — Frontend minimal prêt pour brancher le backend.
			</div>
		</footer>
	);
}
