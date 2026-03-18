import React from 'react';
import './Header.css';

export default function Header({ navItems = [] }) {
	return (
		<header className="site-header">
			<div className="site-header__container">
				<a href="#/" className="site-header__brand">
					Althea Shop
				</a>

				<nav className="site-header__nav">
					{navItems.map((item) => (
						<a key={item.path} href={`#${item.path}`} className="site-header__link">
							{item.label}
						</a>
					))}
				</nav>
			</div>
		</header>
	);
}
