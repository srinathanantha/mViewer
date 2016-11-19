import React from 'react';
import Formsy from 'formsy-react';
import classNames from 'classnames/bind';
import textCss from './LoginTextInput.css';

Formsy.addValidationRule('isRequired', (values, value) => {
  return typeof value !== 'undefined' && value !== '' && value !== false;
});

Formsy.addValidationRule('isRequired1', (values, value, otherField) => {
  return ((typeof value !== 'undefined' && value !== '' && value !== false ) || (otherField==false && value=='')) ;
});

Formsy.addValidationRule('isRequired2', (values, value, otherField) => {
  return ((typeof value !== 'undefined' && value !== '' && value !== false && value!=null)||(otherField == false && value ==null )) ;
});

Formsy.addValidationRule('isNumeric1', (values, value, otherField) => {
  return (value.match(/^[0-9]+$/) || (otherField==false && !value.match(/^[0-9]+$/)));
});

Formsy.addValidationRule('isAlpha1', (values, value, otherField) => {
  if (value !== null){
    return (value.match(/^[\w\-]+$/));
  }
  else {
    return true;
  }
});

Formsy.addValidationRule('isAlpha2', (values, value, otherField) => {
  if (value !== null){
    return (value.match(/^[a-zA-Z][a-zA-Z0-9\-\.]*$/));

  }
  else {
    return true;
  }
});


Formsy.addValidationRule('checkSystemCol', (values, value, otherField) => {
  if (value !== null){
    return (!value.startsWith('system.'));

  }
  else {
    return true;
  }
});

const LoginTextInput = React.createClass({
  // Add the Formsy Mixin
  mixins: [Formsy.Mixin],
  // setValue() will set the value of the component, which in
  // turn will validate it and the rest of the form
  changeValue(event) {
    this.setValue(event.currentTarget['value']);
    this.props.onChange(event.currentTarget['value']);
      this.setState({hoverClass: 'floating-label-hovered'});
      if (event.currentTarget.value == ''){
        this.setState({pristine: true});
      }
      else{
        this.setState({pristine: false});
      }

  },

  getInitialState () {
    return {
      hoverClass: 'floating-label',
      pristine : true,
      hoverInput: 'input'
    }
  },


  focusValue(event){
    this.setState({hoverClass: 'floating-label-hovered'});
  },

  clearCss(){
    this.setState({hoverClass: 'floating-label'});;
  },

  blurValue(event){
    if(this.state.hoverClass == 'floating-label-hovered' && this.state.pristine == true && !event.currentTarget['value']){
      this.setState({hoverClass: 'floating-label'});
    }
  },


  componentDidMount (){
    if(localStorage.getItem('loginData') != undefined && localStorage.getItem('loginData') != null){
      this.setState({hoverClass: 'floating-label-hovered'});
    }
    else{
      this.setState({hoverClass: 'floating-label'});
    }
  },


  render() {
    // An error message is returned ONLY if the component is invalid
    // or the server has returned an error message
    const errorMessage = this.getErrorMessage();
    return (
        <div className={textCss.formGroup + (this.props.className || ' ') + (this.showRequired() ? textCss.required : this.showError() ? textCss.error : '') + ' '  + this.state.hoverInput}>
            <span className={this.state.hoverClass }>{this.props.placeholder.toUpperCase()}</span>
            <input type={this.props.type || 'text'} name={this.props.name} onFocus={this.focusValue} onBlur={this.blurValue} onChange={this.changeValue} value={this.getValue()} disabled ={this.props.shouldBeDisabled || false} className ={((this.props.shouldBeDisabled || false) ? textCss.disabled : '' )}  />
            <span className={ textCss.validationError }>{errorMessage}</span>
        </div>
         );
  }
});

export default LoginTextInput;
