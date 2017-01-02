import React from 'react';
import createDbStyles from './create-db.css';
import $ from 'jquery';
import Modal from 'react-modal';
import { Form } from 'formsy-react';
import TextInput from '../text-input/TextInputComponent.jsx';
import service from '../../gateway/service.js';
import privilegesAPI from '../../gateway/privileges-api.js';
import AuthPopUp from '../auth-popup/AuthPopUpComponent.jsx';
import { browserHistory } from 'react-router';

class CreateDbComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen : false,
      name : null,
      canSubmit : false,
      message : '',
      successMessage : false,
      error : false,
      showAuth : false,
      hasPriv : false
    };
  }

  openModal = () => {
    this.setState({modalIsOpen : true});
    this.setState({message : ''});
    this.setState({error : false});
    let hasPriv = privilegesAPI.hasPrivilege('createCollection', '', this.state.selectedItem);
    if(hasPriv) {
      this.setState({showAuth : false});
    } else{
      this.setState({showAuth : true});
    }
  }

  authClose = () => {
    this.setState({showAuth : false});
    this.setState({modalIsOpen : false});
  }

  closeModal = () => {
    this.setState({modalIsOpen : false});
    if(this.state.successMessage === true) {
      browserHistory.push({ pathname : '/dashboard/home'});
    }
  }

  enableButton() {
    return function() {
      this.setState({
        canSubmit : true
      });
    }.bind(this);
  }

  disableButton() {
    return function() {
      this.setState({
        canSubmit : false
      });
    }.bind(this);
  }

  handleChange = () => {
    this.setState({successMessage : false});
    this.setState({message : ''});
  }


  clickHandler = () => {
    var data = $('form').serialize().split('&');
    var obj = {};
    for(let key in data) {
      obj[data[key].split('=')[0]] = data[key].split('=')[1];
    }
    if (obj['name'] !== '') {
      let partialUrl = 'db/' + obj['name'] + '?connectionId=' + this.props.fromHome.connectionId;
      let createDbCall = service('POST', partialUrl, obj);
      createDbCall.then(this.success.bind(this, obj), this.failure.bind(this, obj));
    } else{
      this.setState({error : true});
    }
  }

  success(obj, data) {
    if (data.response.result) {
      this.setState({message : 'Database ' + obj['name'] + ' was successfully created'});
      this.setState({successMessage : true});
      this.props.refreshDb();
      setTimeout(() => {
        this.closeModal();
      }, 2000);
    }
    if (data.response.error) {
      this.setState({successMessage : false});
      if(data.response.error.code === 'DB_ALREADY_EXISTS') {
        this.setState({message : 'Database ' + obj['name'] + ' already exists'});
      }
      if(data.response.error.code === 'DB_CREATION_EXCEPTION') {
        this.setState({message : 'could not create database with given db name'});
      }
      if(data.response.error.code === 'ANY_OTHER_EXCEPTION') {
        this.setState({message : 'Error occured while creating the database'});
      }
    }
  }

  failure () {

  }

  render () {
    const customStyles = {
      content : {
        top : '50%',
        left : '53%',
        right : 'auto',
        width : '25%',
        minWidth : '200px',
        bottom : 'auto',
        marginRight : '-50%',
        padding : '0px',
        transform : 'translate(-50%, -50%)',
        border : 'none'
      },
      overlay : {
        backgroundColor : 'rgba(0,0,0, 0.74902)'
      }
    };
    return(
      <div className={createDbStyles.mainContainer}>
        <div className = {createDbStyles.topContainer}>
          <section className={createDbStyles.topSection}>WELCOME TO MVIEWER</section>
          <section className={createDbStyles.midSection}>A MONGODB MANAGEMENT TOOL</section>
          <section className={createDbStyles.bottomSection}>LET'S GET STARTED</section>
        </div>
        <div className = {createDbStyles.bottomContainer}>
          <button className={createDbStyles.createButton} onClick={this.openModal}>CREATE NEW DATABASE</button>
          <section className = {createDbStyles.logoSection}>
            <span>POWERED BY</span>
            <img src={'/images/pramati-logo.png'} className={createDbStyles.logo}></img>
          </section>
        </div>
        { !this.state.showAuth ? <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          style = {customStyles}>
          <div className={createDbStyles.two}>
            <div className={createDbStyles.header}>
              <span className={createDbStyles.text}>Create Database</span>
            </div>
            <Form method='POST' onValid={this.enableButton()} onInvalid={this.disableButton()} >
              <div className={ createDbStyles.formContainer}>
                <div className={createDbStyles.inputBox}>
                  <TextInput type="text" name="name" id="name" placeholder="Database name" value={this.state.name} onChange = {this.handleChange} validations={'isRequired2:' + this.state.error + ',isAlpha1:' + this.state.error + ',maxLength:63'} validationErrors={{isRequired2 : 'Db name must not be empty', isAlpha1 : 'Invalid Db name', maxLength : 'Db name exceeds maximum limit' }} />
                </div>
                <div className={createDbStyles.buttons}>
                  <div className={createDbStyles.right}>
                    <span onClick={this.closeModal} value='CANCEL' className={createDbStyles.cancel} >CANCEL</span>
                    <button onClick={this.clickHandler} value='SUBMIT' className={createDbStyles.submit} disabled={!this.state.canSubmit}>CREATE</button>
                  </div>
              </div>
              </div>
            </Form>
             <div className={createDbStyles.clear}></div>
             <div className={!this.state.successMessage ? (createDbStyles.errorMessage + ' ' + (this.state.message !== '' ? createDbStyles.show : createDbStyles.hidden)) : (this.state.message !== '' ? createDbStyles.successMessage : '')}>{this.state.message}</div>
          </div>
        </Modal> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose} action = 'create Database' ></AuthPopUp> }
      </div>
    );
  }
}

CreateDbComponent.propTypes = {
  fromHome : React.PropTypes.object,
  refreshDb : React.PropTypes.func
};

export default CreateDbComponent;
