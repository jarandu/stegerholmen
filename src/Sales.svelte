  <script>
    import Loader from './Loader.svelte';
    export let sales = [];

    const salesPerDay = sales.reduce((acc, curr) => {
      const date = new Date(curr.time).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += curr.sum;
      return acc;
    }, {});

    const max = Math.max(...Object.values(salesPerDay));

  </script>

<div class="sales">
  <h2>Salg</h2>
  {#if sales.length === 0}
    <Loader />
  {:else}
  <div class="sales-info">
    <div>
      Til nå i dag: {sales.filter((s) => new Date(s.time).getDate() == new Date().getDate()).reduce((acc, curr) => {
      return acc + curr.sum;
    }, 0)} kr
    </div>
    <div>
      Totalt: {sales.reduce((acc, curr) => {
        return acc + curr.sum;
      }, 0)} kr
    </div>
    <div class="chart">
      {#each Object.entries(salesPerDay) as [date, sum]}
        <div style="height: {sum / max * 100}%;"></div>
      {/each}
    </div>
  </div>
  <ul>
    {#each sales as sale}
      <li class="sale">
        <div class="timestamp">
          {new Date(sale.time).toLocaleString('nb-NO', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })}
        </div>
        <ul class="sold-items">
          {#each sale.soldItems as soldItem}
            <li>
              {soldItem.product.name}
            </li>
          {/each}
        </ul>
        <div class="payment">
          <div>{sale.paymentMethod}</div>
          <div>{sale.sum} kr</div>
        </div>
      </li>
    {/each}
  </ul>
  {/if}
  </div>

  <style>
    .sales {
      padding: 1.6rem 1.2rem;
    }
    .sales-info {
      margin-bottom: 1.5rem;
    }
    .sales ul {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1.2rem;
      font-size: 0.9rem;
    }
    .sales li.sale {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.15);
    }
    .sales .timestamp {
      font-weight: bold;
      margin-bottom: 0.5rem;
      padding-bottom: 0.3rem;
      border-bottom: 1px solid #ccc;
    }
    .sales ul.sold-items {
      gap: 0.15rem;
      margin-bottom: 0.5rem;
    }
    .sales ul.sold-items li {
      list-style: disc;
      margin-left: 1rem;
    }
    .sales .payment {
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      border-top: 1px solid #ccc;
      padding-top: 0.3rem;
    }
  </style>