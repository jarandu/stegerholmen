<script>
  import { Router, Link, Route } from "svelte-routing";
  import Main from "./Main.svelte";
  import Setup from "./Setup.svelte";

</script>

<Router>
  <nav>
    I dag er det {new Date().toLocaleString('nb-NO', { month: 'short', day: 'numeric', weekday: 'long'})}
    <!-- <Link to="/">Home</Link> -->
  </nav>
  <div>
    <Route path="/"><Main /></Route>
    <Route path="setup"><Setup /></Route>
  </div>
</Router>

<style>
  nav {
    display: flex;
    gap: 1rem;
    font-size: 0.9rem;
    padding: 0.8rem 1.2rem;
    line-height: 1;
    background: #333;
    color: white;
  }
</style>