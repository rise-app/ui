<script>
  export let color = "primary";
</script>

<style lang="scss" type="text/scss">
  @import "../scss/variables";

  // span {
  //   font-size: 14px;
  //   padding: 0.25rem 0.5rem;
  //   border-radius: 5px;
  //   cursor: default;
  // }

  /* Customize the label (the container) */
  .container {
    display: block;
    position: relative;
    padding-left: 35px;
    margin-bottom: 12px;
    cursor: pointer;
    font-size: 22px;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Hide the browser's default checkbox */
  .container input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  /* Create a custom checkbox */
  .checkmark {
    position: absolute;
    top: 0;
    left: 0;
    height: 18px;
    width: 18px;
    background-color: #b5b5be;
    border: 2px solid #979797;
    border-radius: 8px;
  }

  /* On mouse-over, add a grey background color */
  .container:hover input ~ .checkmark {
    background-color: #eee;
  }

  /* When the checkbox is checked, add a colored background */
  @each $key, $color in $colors {
    .container.#{$key} input:checked ~ .checkmark {
      background-color: $color;
      border:none;
      height:22px;
      width:22px;
    }
  }

  /* Create the checkmark/indicator (hidden when not checked) */
  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
  }

  /* Show the checkmark when checked */
  .container input:checked ~ .checkmark:after {
    display: block;
  }

  /* Style the checkmark/indicator */
  .container .checkmark:after {
    left: px;
    top: 4px;
    width: 3px;
    height: 8px;
    border: solid white;
    border-width: 0 3px 3px 0;
    -webkit-transform: rotate(45deg);
    -ms-transform: rotate(45deg);
    transform: rotate(45deg);
  }
</style>

<label
  class="container"
  class:success={color == 'success'}
  class:primary={color == 'primary'}
  class:secondary={color == 'secondary'}
  class:error={color == 'error'}>
  <slot />
  <input type="checkbox" checked="checked" />
  <span class="checkmark" />
</label>
