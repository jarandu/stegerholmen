  <script>
    import Loader from './Loader.svelte';
    export let sales = [];

    const getDatesArray = (startDate, endDate) => {
      const dateArray = [];
      let currentDate = startDate;
      while (currentDate <= endDate) {
        dateArray.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dateArray;
    }

    const salesPerDay = sales.reduce((acc, curr) => {
      const date = new Date(curr.time).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += curr.sum;
      return acc;
    }, {});

    const days = getDatesArray(new Date('2025-07-15'), new Date('2025-08-15')).map((date) => {
      return {
        date,
        sum: salesPerDay[date.toISOString().split('T')[0]] || 0,
      }
    });

    const paymentMethods = sales.reduce((acc, curr) => {
      if (!acc[curr.paymentMethod]) {
        acc[curr.paymentMethod] = 0;
      }
      acc[curr.paymentMethod] += curr.sum;
      return acc;
    }, {});


    const max = Math.max(...Object.values(salesPerDay));

    const salesPerProduct = sales.reduce((acc, curr) => {
      for (const soldItem of curr.soldItems) {
        if (!acc[soldItem.product.name]) acc[soldItem.product.name] = 0;
        acc[soldItem.product.name] += 1;
      }
      return acc;
    }, {});

    const products = Object.entries(salesPerProduct).sort((a, b) => b[1] - a[1]);

    $: today = days.find(day => day.date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]);

  </script>

<div class="sales">
  <h2>Salg</h2>
  {#if sales.length === 0}
    <Loader />
  {:else}
    <div class="sales-info">
      <div class="cards">
        <div class="card">
          <div class="amount">
            {today.sum}<span class="unit">kr</span>
            </div>
          I dag
        </div>
        <div class="card">
          <div class="amount">
            {Object.values(paymentMethods).reduce((acc, curr) => {
              return acc + curr;
            }, 0).toLocaleString('nb-NO')}<span class="unit">kr</span>
          </div>  
          <div>
            {#each Object.entries(paymentMethods) as [method, sum]}
              <div>{method}: {sum.toLocaleString('nb-NO')} kr</div>
            {/each}
          </div>
        </div>
      </div>
      <div class="chart">
        {#each days as {date, sum}}
          <div class="bar" style="height: {sum / max * 100}%;" title="{sum} kr">
            <div class="label">{new Date(date).getDate()}</div>
          </div>
        {/each}
        <div class="y-axis">
          <div class="tick" style="bottom: {1000 / max * 100}%"></div>
          <div class="tick" style="bottom: {2000 / max * 100}%"></div>
          <div class="tick" style="bottom: {3000 / max * 100}%"></div>
        </div>
      </div>
    </div>
    <h3>Siste ti salg</h3>
    <ul class="receipts">
      {#each sales.slice(0,10) as sale}
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
    <h3>Per produkt</h3>
    <ul class="products">
      {#each products as [product, amount], i}
        <li>
          {i + 1}. {product} ({amount})
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .sales {
    padding: 1.6rem 1.2rem;
  }
  h3 {
    margin-top: 2rem;
  }
  .sales-info {
    margin-bottom: 1.5rem;
  }
  .cards {
    display: flex;
    gap: 1.5rem;
  }
  .card {
    padding: 1rem;
    box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.15);
    border-radius: 3px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .card .amount {
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  .unit {
    font-weight: 100;
    margin-left: 0.2em;
  }
  .chart {
    position: relative;
    height: 100px;
    width: 400px;
    max-width: 100%;
    min-width: 50%;
    align-items: flex-end;
    display: flex;
    gap: 3px;
    margin-block: 2rem 3rem;
    margin-inline: auto;
  }
  .bar {
    position: relative;
    flex: 1;
    background: #ccc;
    border-radius: 3px 3px 0 0;
  }
  .bar:last-child {
    background: #666;
  }
  .label {
    background: none;
    position: absolute;
    bottom: -1.2rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.8rem;
  }
  .tick {
    position: absolute;
    left: 0;
    width: 100%;
    height: 0.5px;
    background: #ccc;
  }
  ul.receipts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 1.2rem;
    font-size: 0.9rem;
  }
  .receipts li.sale {
    display: flex;
    flex-direction: column;
    padding: 1rem;
    box-shadow: 0 1px 10px 0 rgba(0, 0, 0, 0.15);
  }
  .receipts .timestamp {
    font-weight: bold;
    margin-bottom: 0.5rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid #ccc;
  }
  .receipts ul.sold-items {
    gap: 0.15rem;
    margin-bottom: 0.5rem;
  }
  .receipts ul.sold-items li {
    list-style: disc;
    margin-left: 1rem;
  }
  .receipts .payment {
    display: flex;
    justify-content: space-between;
    margin-top: auto;
    border-top: 1px solid #ccc;
    padding-top: 0.3rem;
  }
  ul.products {
    column-count: 3;
  }

  @media (max-width: 600px) {
    ul.products {
      column-count: 2;
    }
  }
</style>