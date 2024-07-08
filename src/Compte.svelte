<script>

import Sales from './Sales.svelte';
import Loader from './Loader.svelte';

let sales = [];

const getSales = async () => {
  const salesData = await fetch('./api/allsales').then(res => res.json());
  sales = salesData;
}

getSales();
</script>

{#if sales.length}
  <Sales {sales} />
{:else}
  <div class="loading">
    Laster salg...
    <Loader />
  </div>
{/if}

<style>
  .loading {
    padding: 1.6rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
