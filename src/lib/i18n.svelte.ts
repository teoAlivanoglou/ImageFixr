import { getLocale, setLocale } from '$paraglide/runtime.js';

class I18nState {
	current = $state<'en' | 'el'>('en');

	constructor() {
		if (typeof window !== 'undefined') {
			const saved = localStorage.getItem('image-fixr-locale') as 'en' | 'el';
			if (saved === 'en' || saved === 'el') {
				this.current = saved;
				setLocale(saved, { reload: false });
			} else {
				const active = getLocale() as 'en' | 'el';
				this.current = active === 'el' ? 'el' : 'en';
			}
			document.documentElement.lang = this.current;
		}
	}

	setLanguage(lang: 'en' | 'el') {
		this.current = lang;
		setLocale(lang, { reload: false });
		if (typeof window !== 'undefined') {
			localStorage.setItem('image-fixr-locale', lang);
			document.documentElement.lang = lang;
		}
	}

	toggle() {
		const next = this.current === 'en' ? 'el' : 'en';
		this.setLanguage(next);
	}
}

export const i18n = new I18nState();
