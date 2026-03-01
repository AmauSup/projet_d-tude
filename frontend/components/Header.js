import React from 'react';

export default function Header({ navItems = [] }) {
	return (
		<header
			style={{
				borderBottom: '1px solid #e5e7eb',
				background: '#ffffff',
			}}
		>
			<div
				style={{
					maxWidth: 1100,
					margin: '0 auto',
					padding: '14px 16px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: 16,
				}}
			>
				<a href="#/" style={{ textDecoration: 'none', color: '#111827', fontWeight: 700, fontSize: 18 }}>
					Althea Shop
				</a>

				<nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
					{navItems.map((item) => (
						<a
							key={item.path}
							href={`#${item.path}`}
							style={{ textDecoration: 'none', color: '#2563eb', fontSize: 14, fontWeight: 600 }}
						>
							{item.label}
						</a>
					))}
				</nav>
			</div>
		</header>
	);
}
