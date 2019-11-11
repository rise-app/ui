<script>
  export let color = "primary";

  export let type = "text";
  export let label = "";
  // export let size = undefined;
  // export let bsSize = undefined;
  // export let checked = false;
  export let valid = false;
  export let invalid = false;
  // export let plaintext = false;
  // export let addon = false;
  export let value = "";
  export let readonly = false;
  // export let multiple = false;
  export let id = "";
  export let name = "";
  export let placeholder = "";
  export let disabled = false;

  let tag;
</script>

<style type="text/scss" lang="scss">
  @import "../scss/variables";

  .form-field {
    display: inline-block;
    position: relative;

    // To avoid problems with text-align.
    text-align: left;

    [dir="rtl"] & {
      text-align: right;
    }

    input {
      background: transparent;
      border: 2px solid #e2e2ea;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      outline: none;
    }

    @each $key, $color in $colors {
      &.#{$key} {
        input:focus {
          border: 2px solid $color;
        }

        label {
          color: $color;
        }
      }
    }
  }

  // Used to hide the label overflow on IE, since IE doesn't take transform into account when
  // determining overflow.
  .label-wrapper {
    position: absolute;
    left: 0;
    box-sizing: content-box;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none; // We shouldn't catch mouse events (let them through).

    [dir="rtl"] & {
      // Usually this isn't necessary since the element is 100% wide, but
      // when we've got a `select` node, we need to set a `max-width` on it.
      left: auto;
      right: 0;
    }
  }

  // The label itself. This is invisible unless it is. The logic to show it is
  // basically `empty || (float && (!empty || focused))`. Float is dependent on the
  // `floatingPlaceholder` property.
  label {
    // The label is after the form field control, but needs to be aligned top-left of the infix <div>.
    position: absolute;
    left: 0;

    font: inherit;
    pointer-events: none; // We shouldn't catch mouse events (let them through).

    // Put ellipsis text overflow.
    width: 100%;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;

    transform-origin: 0 0;

    [dir="rtl"] & {
      transform-origin: 100% 0;
      left: auto;
      right: 0;
    }
  }
</style>

<div
  class="form-field"
  class:primary={color == 'primary'}
  class:secondary={color == 'secondary'}
  class:error={color == 'error'}>

  <div class="label-wrapper">
    <label>{label}</label>
  </div>
  <input
    {id}
    type="text"
    on:blur
    on:focus
    on:keydown
    on:keypress
    on:keyup
    on:change
    on:input
    bind:value
    {readonly}
    {name}
    {disabled}
    {placeholder} />

  <!-- class={classes} -->
</div>
