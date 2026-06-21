<script lang="ts">
  import { onMount } from 'svelte';
  import Loader from './Loader.svelte';
  import { createProducts, fetchImages, getProducts } from './utils';
  import type { Category, Product, ProductRow } from './lib/types';

  const categories: Category[] = ['Dryck', 'Mat', 'Glass', 'Godis'];

  const emptyRow = (): ProductRow => ({
    name: '',
    price: '',
    category: 'Dryck',
    slug: '',
    image: '',
  });

  let images: string[] = [];
  let existingProducts: Product[] = [];
  let rows: ProductRow[] = [emptyRow()];
  let activePicker: number | null = null;
  let loading = true;
  let saving = false;
  let message = '';
  let error = '';

  const imageSlug = (filename: string) => filename.replace(/\.[^.]+$/, '');

  const addRow = () => {
    rows = [...rows, emptyRow()];
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) {
      rows = [emptyRow()];
      return;
    }
    rows = rows.filter((_, i) => i !== index);
    if (activePicker === index) activePicker = null;
  };

  const selectImage = (index: number, filename: string) => {
    rows[index] = {
      ...rows[index],
      image: filename,
      slug: imageSlug(filename),
    };
    rows = [...rows];
    activePicker = null;
  };

  const validRows = (): ProductRow[] =>
    rows.filter((row) => row.name.trim() && row.price !== '' && row.slug.trim() && row.image);

  const save = async () => {
    const products = validRows();
    if (products.length === 0) {
      error = 'Fyll inn minst ett produkt med navn, pris og bilde.';
      message = '';
      return;
    }

    saving = true;
    message = '';
    error = '';

    try {
      const created = await createProducts(
        products.map((row) => ({
          name: row.name.trim(),
          price: parseFloat(row.price),
          slug: row.slug.trim(),
          category: row.category,
          image: row.image,
        }))
      );

      existingProducts = [...existingProducts, ...created];
      message = `${created.length} produkt${created.length === 1 ? '' : 'er'} lagt til.`;
      rows = [emptyRow()];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Noe gikk galt';
    } finally {
      saving = false;
    }
  };

  onMount(async () => {
    try {
      [images, existingProducts] = await Promise.all([fetchImages(), getProducts()]);
      existingProducts = existingProducts ?? [];
    } catch (err) {
      error = err instanceof Error ? err.message : 'Noe gikk galt';
    } finally {
      loading = false;
    }
  });
</script>

<div class="setup">
  <h2>Oppsett – legg til produkter</h2>

  {#if loading}
    <div class="loader">
      <Loader />
    </div>
  {:else}
    {#if message}
      <p class="message success">{message}</p>
    {/if}
    {#if error}
      <p class="message error">{error}</p>
    {/if}

    <section class="batch">
      <div class="batch-header">
        <h3>Batch</h3>
      </div>

      <div class="rows">
        {#each rows as row, index}
          <div class="row">
            <label>
              Navn
              <input type="text" bind:value={row.name} placeholder="Kaffebulle" />
            </label>
            <label>
              Pris
              <input type="number" min="0" step="1" bind:value={row.price} placeholder="25" />
            </label>
            <label>
              Kategori
              <select bind:value={row.category}>
                {#each categories as category}
                  <option value={category}>{category}</option>
                {/each}
              </select>
            </label>
            <div class="image-field">
              <span>Bilde</span>
              {#if row.image}
                <button
                  type="button"
                  class="image-preview"
                  on:click={() => (activePicker = activePicker === index ? null : index)}
                >
                  <img src="/images/{row.image}" alt="" />
                  <span>{row.image}</span>
                </button>
              {:else}
                <button
                  type="button"
                  class="pick-image"
                  on:click={() => (activePicker = activePicker === index ? null : index)}
                >
                  Velg bilde
                </button>
              {/if}
            </div>
            <button type="button" class="remove" on:click={() => removeRow(index)} aria-label="Fjern rad">
              ×
            </button>

            {#if activePicker === index}
              <div class="image-picker">
                <p>Velg fra public/images ({images.length} bilder)</p>
                <div class="image-grid">
                  {#each images as filename}
                    <button
                      type="button"
                      class:selected={row.image === filename}
                      on:click={() => selectImage(index, filename)}
                    >
                      <img src="/images/{filename}" alt={filename} loading="lazy" />
                      <span>{filename}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <div class="actions">
        <button type="button" class="add" on:click={addRow}>Legg til produkt</button>
        <button type="button" class="save" disabled={saving} on:click={save}>
          {#if saving}
            Lagrer…
          {:else}
            Lagre {validRows().length || ''} produkt{validRows().length === 1 ? '' : 'er'}
          {/if}
        </button>
      </div>
    </section>

    {#if existingProducts.length > 0}
      <section class="existing">
        <h3>Eksisterende produkter ({existingProducts.length})</h3>
        <ul>
          {#each existingProducts as product}
            <li>
              <img src="/images/{product.image || product.slug + '.jpg'}" alt="" />
              <div>
                <strong>{product.name}</strong>
                <span>{product.price} kr · {product.category}</span>
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  {/if}
</div>

<style>
  .setup {
    padding: 0 1.2rem 2rem;
    max-width: 960px;
  }

  .loader {
    display: flex;
    justify-content: center;
    padding: 4rem 0;
  }

  .message {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin: 0 0 1rem;
  }

  .message.success {
    background: #e8f5e9;
    color: #1b5e20;
  }

  .message.error {
    background: #ffebee;
    color: #b71c1c;
  }

  .batch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .batch-header h3,
  .existing h3 {
    margin: 0;
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .row {
    display: grid;
    grid-template-columns: 1.5fr 0.75fr 1fr 1.25fr auto;
    gap: 0.75rem;
    align-items: end;
    padding: 1rem;
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.08);
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: #555;
  }

  input,
  select {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    padding: 0.55rem 0.65rem;
    border: 1px solid #ccc;
    border-radius: 0.4rem;
    background: #fafafa;
    font-size: 1rem;
    color: #111;
  }

  select {
    cursor: pointer;
  }

  .image-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: #555;
  }

  .pick-image,
  .image-preview {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    border: 1px dashed #aaa;
    border-radius: 0.4rem;
    cursor: pointer;
    min-height: 2.5rem;
    background: #fafafa;
  }

  .image-preview img {
    width: 2rem;
    height: 2rem;
    object-fit: contain;
  }

  .image-preview span {
    font-size: 0.75rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove {
    all: unset;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 99px;
    background: #f5f5f5;
    color: #666;
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
  }

  .image-picker {
    grid-column: 1 / -1;
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 1px solid #eee;
  }

  .image-picker p {
    margin: 0 0 0.75rem;
    font-size: 0.9rem;
    color: #666;
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(5.5rem, 1fr));
    gap: 0.5rem;
    max-height: 16rem;
    overflow: auto;
    padding: 0.25rem;
  }

  .image-grid button {
    all: unset;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.4rem;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    background: #f9f9f9;
  }

  .image-grid button:hover,
  .image-grid button.selected {
    border-color: #333;
    background: white;
  }

  .image-grid img {
    width: 100%;
    aspect-ratio: 1;
    object-fit: contain;
  }

  .image-grid span {
    font-size: 0.6rem;
    text-align: center;
    word-break: break-all;
    color: #666;
  }

  .add,
  .save {
    all: unset;
    padding: 0.65rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 0.95rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .add {
    flex: 1;
    text-align: center;
    border: 1px solid #333;
    color: #333;
    padding: 0.85rem;
  }

  .save {
    flex: 1;
    text-align: center;
    background: #28903f;
    color: white;
    padding: 0.85rem;
  }

  .save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .existing {
    margin-top: 2.5rem;
  }

  .existing ul {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
    gap: 0.75rem;
  }

  .existing li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.06);
  }

  .existing img {
    width: 2.5rem;
    height: 2.5rem;
    object-fit: contain;
  }

  .existing strong {
    display: block;
  }

  .existing span {
    font-size: 0.85rem;
    color: #666;
  }

  @media (max-width: 720px) {
    .row {
      grid-template-columns: 1fr 1fr;
    }

    .image-field,
    .image-picker {
      grid-column: 1 / -1;
    }

    .remove {
      grid-column: 2;
      justify-self: end;
    }
  }
</style>
