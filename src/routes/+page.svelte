<script lang="ts">
	import { onMount } from 'svelte';
	import Hero from '$lib/components/Hero.svelte';
	import ComingSoonMessage from '$lib/components/ComingSoonMessage.svelte';
	import AnimatedBackground from '$lib/components/AnimatedBackground.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let isVisible = $state(false);

	onMount(() => {
		// Trigger animation after mount
		setTimeout(() => {
			isVisible = true;
		}, 100);

		// Intersection Observer for scroll animations
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('visible');
					}
				});
			},
			{ threshold: 0.1 }
		);

		document.querySelectorAll('.animate-on-scroll').forEach((el) => {
			observer.observe(el);
		});

		return () => observer.disconnect();
	});
</script>

<div class="relative">
	<AnimatedBackground />

	<div class="relative z-10">
		<div class={`transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
			<Hero />
			<ComingSoonMessage />
			<Footer />
		</div>
	</div>
</div>
