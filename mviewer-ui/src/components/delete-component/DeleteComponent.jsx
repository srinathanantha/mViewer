import React from 'react';
import deleteStyles from './delete.css';
import Modal from 'react-modal';
import service from '../../gateway/service.js';

class DeleteComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen : false,
      message : '',
      successMessage : false,
      showAuth : false
    };
  }

  closeModal = () => {
    this.props.closeModal(this.state.successMessage, 'delete');
  }

  clickHandlerYes = () => {
    const type = this.props.title;
    let obj = {};
    let deleteUrl = '';

    if(type === 'database') {
      deleteUrl = 'db/' + this.props.dbName + '?connectionId=' + this.props.connectionId;
    }
    if(type === 'collection') {
      deleteUrl = this.props.dbName + '/collection/' + this.props.collectionName + '?connectionId=' + this.props.connectionId;
    }
    if(type === 'document') {
      deleteUrl = this.props.dbName + '/' + this.props.collectionName + '/document?connectionId=' + this.props.connectionId;
      obj['_id'] = this.props.uId;
    }
    if(type === 'GridFS Bucket') {
      deleteUrl = this.props.dbName + '/gridfs/' + this.props.gridFSName + '/dropbucket?connectionId=' + this.props.connectionId;
    }
    if(type === 'file') {
      deleteUrl = this.props.dbName + '/gridfs/' + this.props.collectionName + '/dropfile?id=' + this.props.uId + '&connectionId=' + this.props.connectionId;
    }

    if(type === 'User') {
      deleteUrl = this.props.dbName + '/usersIndexes/removeUser?connectionId=' + this.props.connectionId;
      obj['username'] = this.props.userName;
    }

    let deleteCall = null;
    if(type === 'User') {
      deleteCall = service('POST', deleteUrl, obj);
    } else {
      deleteCall = service('DELETE', deleteUrl, obj);
    }
    deleteCall.then(this.success.bind(this), this.failure.bind(this));

  }

  success(data) {
    if (data.response.result) {
      this.setState({successMessage : true});
      this.setState({message : this.props.title + ' has been deleted.'});
    }
    if (data.response.error) {
      if (data.response.error.code === 'DELETING_FROM_CAPPED_COLLECTION') {
        this.setState({successMessage : false});
        this.setState({message : data.response.error.message});
      } else{
        this.setState({successMessage : false});
        this.setState({message : 'Error in deleting the ' + this.props.title});
      }
    }
    setTimeout(() => {
      this.closeModal();
    }, 2000);
  }

  failure() {
  }

  clickHandlerNo = () => {
    this.props.closeModal();
  }

  render () {
    const customStyles = {
      content : {
        top : '50%',
        left : '50%',
        right : 'auto',
        bottom : 'auto',
        transform : 'translate(-50%, -50%)',
        minWidth : '332px',
        zIndex : '4',
        borderRadius : '2px'
      }
    };

    return(
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.closeModal}
        style = {customStyles}>
        <div className={deleteStyles.two}>
          {this.state.message === '' ? <label>Are you sure to delete the {this.props.title} ?</label> : <label></label>}
           <div className={!this.state.successMessage ? (deleteStyles.errorMessage + ' ' + (this.state.message !== '' ? deleteStyles.show : deleteStyles.hidden)) : (this.state.message !== '' ? deleteStyles.successMessage : '')}>{this.state.message}</div>
             <div className ={this.state.message === '' ? (deleteStyles.choiceContainer + ' ' + deleteStyles.showChoice) : (deleteStyles.choiceContainer + ' ' + deleteStyles.hideChoice)}>
               <button onClick={this.clickHandlerNo} value='NO' className={deleteStyles.cancel} >NO</button>
               <button onClick={this.clickHandlerYes} value='YES' className={deleteStyles.submit} >YES</button>
             </div>
        </div>
      </Modal>

    );
  }
}

DeleteComponent.propTypes = {
  closeModal : React.PropTypes.func,
  title : React.PropTypes.string,
  dbName : React.PropTypes.string,
  connectionId : React.PropTypes.string,
  collectionName : React.PropTypes.string,
  uId : React.PropTypes.string,
  gridFSName : React.PropTypes.string,
  userName : React.PropTypes.string,
  modalIsOpen : React.PropTypes.bool
};

export default DeleteComponent;
