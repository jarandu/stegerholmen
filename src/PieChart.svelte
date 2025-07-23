<script>
  export let data = []; // [{ label: 'Glass', value: 100, color: '#006671' }, ...]
  $: total = data.reduce((sum, d) => sum + d.value, 0);

  // Lag conic-gradient string
  $: gradient = (() => {
    let start = 0;
    return data.sort((a, b) => b.value - a.value).map((d, i) => {
      const percent = d.value / total * 100;
      const end = start + percent;
      const str = `${d.color} ${start}% ${end}%`;
      start = end;
      return str;
    }).join(', ');
  })();
</script>

<div class="piechart">
  <div class="pie" style="background: conic-gradient({gradient});"></div>
  <div class="legend">
    {#each data as d}
      <div class="legend-row">
        <span class="color" style="background: {d.color}"></span>
        <span class="label">{d.label}</span>
        <span class="value">{d.value.toLocaleString('nb-NO', {
          maximumFractionDigits: 0,
        })} kr</span>
      </div>
    {/each}
  </div>
</div>

<style>
.piechart {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.pie {
  width: 120px;
  height: 120px;
  border-radius: 50%;
}
.legend {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}
.legend-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  font-size: 0.85rem;
}
.color {
  width: 0.8em;
  height: 0.8em;
  border-radius: 50%;
  display: inline-block;
}
.label {
  font-weight: 500;
}
.value {
  margin-left: 1em;
  font-variant-numeric: tabular-nums;
  color: #555;
  margin-left: auto;
  text-align: right;
}
</style>