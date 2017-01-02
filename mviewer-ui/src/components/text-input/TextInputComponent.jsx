import React from 'react';
import Formsy from 'formsy-react';
import textCss from './text-input.css';

Formsy.addValidationRule('isRequired', (values, value) => {
  return typeof value !== 'undefined' && value !== '' && value !== false;
});

Formsy.addValidationRule('isRequired1', (values, value, otherField) => {
  return ((typeof value !== 'undefined' && value !== '' && value !== false ) || (otherField === false && value === '')) ;
});

Formsy.addValidationRule('isRequired2', (values, value, otherField) => {
  return ((typeof value !== 'undefined' && value !== '' && value !== false && value != null) || (otherField === false && value == null )) ;
});

Formsy.addValidationRule('isNumeric1', (values, value, otherField) => {
  return (value !== '' ? value.match(/^[0-9]+$/) || (otherField === false && !value.match(/^[0-9]+$/)) : true);
});

Formsy.addValidationRule('maxSize', (values, value) => {
  return (value !== '' ? parseInt(value) <= parseInt('9223372036854774784') : true);
});

Formsy.addValidationRule('checkZero', (values, value) => {
  return (value !== '' ? parseInt(value) > 0 : true);
});

Formsy.addValidationRule('maxDocs', (values, value) => {
  return (value !== '' ? parseInt(value) <= parseInt('2147483647') : true);
});

Formsy.addValidationRule('isAlpha1', (values, value) => {
  if (value != null) {
    return (value.match(/^[\w\-]+$/));
  } else {
    return true;
  }
});

Formsy.addValidationRule('isAlpha2', (values, value) => {
  if (value != null) {
    return (value.match(/^[a-zA-Z][a-zA-Z0-9\-\.\_]*$/));

  } else {
    return true;
  }
});


Formsy.addValidationRule('checkSystemCol', (values, value) => {
  if (value != null) {
    return (!value.startsWith('system.'));

  } else {
    return true;
  }
});

const TextInput = React.createClass({
  // Add the Formsy Mixin
  mixins : [Formsy.Mixin],
  // setValue() will set the value of the component, which in
  // turn will validate it and the rest of the form
  changeValue(event) {
    this.setValue(event.currentTarget['value']);
    // this.refs.great.great();
    this.props.onChange(event.currentTarget['value']);
  },


  propTypes : {
    name : React.PropTypes.string,
    title : React.PropTypes.string,
    type : React.PropTypes.string,
    className : React.PropTypes.string,
    placeholder : React.PropTypes.string,
    onChange : React.PropTypes.func.isRequired,
    shouldBeDisabled : React.PropTypes.bool
  },

  render() {
    // An error message is returned ONLY if the component is invalid
    // or the server has returned an error message
    const errorMessage = this.getErrorMessage();
    return (
        <div className={textCss.formGroup + (this.props.className || ' ') + (this.showRequired() ? textCss.required : this.showError() ? textCss.error : '')}>
            <label htmlFor={this.props.name}>{this.props.title}</label>
            <input type={this.props.type || 'text'} name={this.props.name} placeholder={this.props.placeholder} onChange={this.changeValue} value={this.getValue()} disabled ={this.props.shouldBeDisabled || false} className ={((this.props.shouldBeDisabled || false) ? textCss.disabled : '' )} />
            <span className={ textCss.validationError }>{errorMessage}</span>
        </div>
    );
  }
});

export default TextInput;