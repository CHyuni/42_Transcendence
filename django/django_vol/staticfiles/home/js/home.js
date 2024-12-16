document.addEventListener('DOMContentLoaded', function () {
	const contentDiv = document.getElementById('content');
	contentDiv.innerHTML = `
		<h1 class="headline">PING PONG</h1>
		<button id="myButton" class="btn">login 42 oauth</button>
	`;

	const button = document.getElementById('myButton');
	button.addEventListener('click', function() {
		const clientId = 'u-s4t2ud-2f36542895ec170f78a3b16b336312f13826f4f1cc5a856127e0bd6119deefcd';
		const redirectUri = encodeURIComponent('http://localhost:8080/callback/');
		const authUrl = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
		window.location.href = authUrl;
	})
});
