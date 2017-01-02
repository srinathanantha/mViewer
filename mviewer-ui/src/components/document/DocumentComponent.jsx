import React from 'react';
import documentStyles from './document.css';
import $ from 'jquery';
import DeleteComponent from '../delete-component/DeleteComponent.jsx';
import NewDocument from '../new-document/NewDocumentComponent.jsx';
import autosize from 'autosize';
import privilegesAPI from '../../gateway/privileges-api.js';
import AuthPopUp from '../auth-popup/AuthPopUpComponent.jsx';

class DocumentComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen : false,
      message : '',
      successMessage : false,
      value : this.props.value,
      disabled : true,
      _isMounted : false,
      showAuth : false,
      hasPriv : false
    };
  }

  openModal() {
    this.setState({modalIsOpen : true});
    this.setState({message : ''});
    const hasPriv = privilegesAPI.hasPrivilege('remove', this.props.currentItem, this.props.currentDb);
    if(hasPriv) {
      this.setState({showAuth : false});
    } else{
      this.setState({showAuth : true});
    }
  }

  authClose() {
    this.setState({showAuth : false});
    this.setState({modalIsOpen : false});
  }

  editHandler() {
    this.setState({disabled : false});
  }

  changeHandler() {
    return function(e) {
      this.setState({value : e.target.value});
    }.bind(this);

  }

  componentWillReceiveProps() {
    this.setState({value : this.props.value});
  }

  closeModal(successMessage) {
    if(this.state._isMounted === true) {
      this.setState({modalIsOpen : false});
      if (successMessage === true) {
        this.props.refresh('delete');
      }
    }
  }

  componentDidMount() {
    this.setState({_isMounted : true});
  }

  componentWillUnmount() {
    this.setState({_isMounted : false});
  }
  render () {
    autosize($('.textArea'));
    autosize.update($('.textArea'));
    return(
      <div className={documentStyles.results + ' ' + documentStyles.clearfix}>
        { this.props.queryType === 'collection' ?
          <NewDocument currentDb={this.props.currentDb} currentItem={this.props.currentItem} addOrEdit='Edit' connectionId={this.props.connectionId} documentValue = {this.state.value} uId = {this.props.uId} refresh = {this.props.refresh}></NewDocument>
          : null }
        <form>
          <span className={documentStyles.deleteButton} ><i className="fa fa-trash" aria-hidden="true" onClick={this.openModal.bind(this)}></i></span>
          <textarea key={this.props.key1} className ='textArea' value={this.state.value} onChange={this.changeHandler()} disabled={this.state.disabled}></textarea>
          {this.state.modalIsOpen ? ( !this.state.showAuth ? <DeleteComponent modalIsOpen={this.state.modalIsOpen} closeModal={this.closeModal.bind(this)} title = {this.props.queryType === 'collection' ? 'document' : 'file'} dbName = {this.props.currentDb} collectionName = {this.props.currentItem} connectionId={this.props.connectionId} uId= {this.props.uId} ></DeleteComponent> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose.bind(this)} action = {this.props.queryType === 'collection' ? 'drop document' : 'drop file'} ></AuthPopUp> ) : ''}
        </form>
      </div>
    );
  }
}

DocumentComponent.propTypes = {
  value : React.PropTypes.string,
  currentItem : React.PropTypes.string,
  currentDb : React.PropTypes.string,
  refresh : React.PropTypes.func,
  queryType : React.PropTypes.string,
  connectionId : React.PropTypes.string,
  uId : React.PropTypes.string,
  key1 : React.PropTypes.string
};

export default DocumentComponent;
