<script>
import Sales from './Sales.svelte';
import Loader from './Loader.svelte';
import { fetchSales } from './utils';

let sales = [];

const getSales = async () => {
  try {
    const salesData = await fetchSales();
    sales = salesData;
  } catch (error) {
    console.error('Error fetching sales:', error);
  }
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
