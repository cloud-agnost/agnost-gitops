export default function componentLoader(lazyComponent: any, attemptsLeft = 10) {
	window.sessionStorage.setItem('pageForceRefreshed', 'false');
	return new Promise((resolve, reject) => {
		lazyComponent()
			.then(resolve)
			.catch((error: any) => {
				setTimeout(() => {
					if (attemptsLeft === 1) {
						const pageForceRefreshed =
							window.sessionStorage.getItem('pageForceRefreshed') === 'true';

						if (!pageForceRefreshed) {
							window.sessionStorage.setItem('pageForceRefreshed', 'true');
							return window.location.reload();
						} else {
							reject(error);
							return;
						}
					}
					componentLoader(lazyComponent, attemptsLeft - 1).then(resolve, reject);
				}, 2000);
			});
	});
}
