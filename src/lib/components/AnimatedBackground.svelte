<script lang="ts">
	import { onMount } from 'svelte';

	let scrollY = $state(0);

	onMount(() => {
		const handleScroll = () => {
			scrollY = window.scrollY;
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

<div class="fixed inset-0 -z-10 overflow-hidden">
	<!-- Gradient background -->
	<div
		class="absolute inset-0 bg-gradient-to-br from-wedding-ivory via-wedding-cream to-wedding-blush"
	></div>

	<!-- Subtle parallax circles -->
	<div
		class="absolute top-20 right-20 w-96 h-96 rounded-full bg-wedding-gold/5 blur-3xl"
		style={`transform: translateY(${scrollY * 0.3}px)`}
	></div>

	<div
		class="absolute bottom-40 left-20 w-80 h-80 rounded-full bg-wedding-blush-deep/10 blur-3xl"
		style={`transform: translateY(${scrollY * 0.2}px)`}
	></div>

	<!-- Decorative pattern overlay -->
	<div class="absolute inset-0 opacity-5">
		<svg width="100%" height="100%">
			<pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
				<circle cx="20" cy="20" r="1" fill="#D4AF37" />
			</pattern>
			<rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
		</svg>
	</div>
</div>
