<script lang="ts">
	const mainMessage = 'Em Breve';
	const subMessage = 'Estamos preparando algo especial para você.';
	const detailMessage =
		'Nosso site de casamento estará disponível em breve com todas as informações sobre nosso grande dia!';
</script>

<section class="py-20 px-4 bg-gradient-to-b from-transparent to-wedding-cream/30">
	<div class="max-w-3xl mx-auto text-center space-y-8">
		<!-- Main "Coming Soon" message -->
		<div class="animate-on-scroll">
			<h2 class="font-heading text-5xl md:text-6xl text-wedding-gold mb-6">
				{mainMessage}
			</h2>

			<p class="font-body text-xl md:text-2xl text-gray-700 mb-8">
				{subMessage}
			</p>
		</div>

		<!-- Detailed message -->
		<div class="animate-on-scroll">
			<div class="card bg-white/80 backdrop-blur-sm shadow-xl border border-wedding-gold/20 p-8">
				<p class="font-body text-lg text-gray-600 leading-relaxed">
					{detailMessage}
				</p>
			</div>
		</div>

		<!-- Decorative elements -->
		<div class="animate-on-scroll flex justify-center gap-4 pt-8">
			<div class="w-2 h-2 rounded-full bg-wedding-gold animate-shimmer"></div>
			<div
				class="w-2 h-2 rounded-full bg-wedding-gold animate-shimmer"
				style="animation-delay: 0.3s;"
			></div>
			<div
				class="w-2 h-2 rounded-full bg-wedding-gold animate-shimmer"
				style="animation-delay: 0.6s;"
			></div>
		</div>
	</div>
</section>
