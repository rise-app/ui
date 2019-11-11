<script>
  import Button from "./components/Button.svelte";
  import Status from "./components/Status.svelte";
  import Input from "./components/Input.svelte";
  import Checkbox from "./components/Checkbox.svelte";

  let value = "tim";

  function sayHello() {
    console.log(confirm("Tim"));
  }
</script>

<style lang="scss" type="text/scss">

</style>

<h3>Buttons</h3>
<Button on:click={sayHello}>Submit</Button>
<Button type="no-outline">Submit</Button>
<Button type="outline">Submit</Button>

<h4>Small Buttons</h4>
<Button size="small">Submit</Button>
<Button size="small" type="no-outline">Submit</Button>
<Button size="small" type="outline">Submit</Button>

<h4>Secondary Buttons</h4>
<Button color="secondary">Submit</Button>
<Button color="secondary" type="no-outline">Submit</Button>
<Button color="secondary" type="outline">Submit</Button>

<Button color="secondary" size="small">Submit</Button>
<Button color="secondary" size="small" type="no-outline">Submit</Button>
<Button color="secondary" size="small" type="outline">Submit</Button>

<h4>Error Buttons</h4>
<Button color="error">Submit</Button>
<Button color="error" type="no-outline">Submit</Button>
<Button color="error" type="outline">Submit</Button>

<Button color="error" size="small">Submit</Button>
<Button color="error" size="small" type="no-outline">Submit</Button>
<Button color="error" size="small" type="outline">Submit</Button>

<h3>Input</h3>
<Input on:click={sayHello} bind:value label="First Name" />
<Input color="error" on:click={sayHello} bind:value label="First Name" />
<Input color="secondary" on:click={sayHello} bind:value label="First Name" />

<h3>Status</h3>
<Status>Primary</Status>
<Status type="success">Success</Status>
<Status type="warn">Warn</Status>
<Status type="error">Error</Status>

<h3>Checkboxes</h3>
<Checkbox>Primary</Checkbox>
