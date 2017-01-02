import React from 'react';
/*eslint-disable */
import toolTip from '../shared/tool-tip.js';
/*eslint-enable */
import collectionListStyles from '../shared/list-panel.css';
import DeleteComponent from '../delete-component/DeleteComponent.jsx';
import privilegesAPI from '../../gateway/privileges-api.js';
import AuthPopUp from '../auth-popup/AuthPopUpComponent.jsx';

class CollectionItemComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hoverFlag : false,
      modalIsOpen : false,
      _isMounted : false,
      showAuth : false,
      hasPriv : false
    };
    this.closeModal = this.closeModal.bind(this);
  }

  openModal = () => {
    this.setState({modalIsOpen : true});
    this.setState({message : ''});
    const hasPriv = privilegesAPI.hasPrivilege('dropCollection', this.props.name, this.props.dbName);
    if(hasPriv && !this.props.name.startsWith('system.')) {
      this.setState({showAuth : false});
    } else{
      this.setState({showAuth : true});
    }
  }

  authClose = () => {
    this.setState({showAuth : false});
    this.setState({modalIsOpen : false});
  }

  closeModal(successMessage, fromDeleteButton) {
    if(this.state._isMounted === true) {
      if(successMessage === true) {
        if(fromDeleteButton === 'delete') {

          this.props.refreshCollectionListForDelete(this.props.dbName);
        } else {
          this.props.refreshCollectionList(this.props.dbName, false);
        }

      }
      this.setState({modalIsOpen : false});
    }
  }

  componentDidMount() {
    this.setState({_isMounted : true});
  }

  componentWillUnmount() {
    this.setState({_isMounted : false});
  }

  onClick = () => {
    this.props.onClick(this.props.idx, this.props.name);
  }

  render () {
    return (
      <div className={(this.props.isSelected ? collectionListStyles.menuItem + ' ' + collectionListStyles.highlight : collectionListStyles.menuItem)} key={this.props.name} onClick={this.onClick} value={this.props.name} >
        <span className = {collectionListStyles.collectionIcon}>
          <i className="fa fa-files-o" aria-hidden="true"></i>
        </span>
        <span id="toolTip" className = {collectionListStyles.button}>{this.props.name}</span>
        <i className={'fa fa-trash ' + collectionListStyles.trash} aria-hidden="true" onClick = {this.openModal}></i>
        {this.state.modalIsOpen ? ( !this.state.showAuth ? <DeleteComponent modalIsOpen={this.state.modalIsOpen} closeModal={this.closeModal} title = 'collection' dbName = {this.props.dbName} collectionName = {this.props.name} connectionId={this.props.connectionId} ></DeleteComponent> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose} action = 'drop collection' ></AuthPopUp> ) : null}
      </div>
    );
  }

}
CollectionItemComponent.getDefaultProps = {
  isSelected : false
};
CollectionItemComponent.propTypes = {
  onClick : React.PropTypes.func.isRequired,
  isSelected : React.PropTypes.bool,
  name : React.PropTypes.string,
  dbName : React.PropTypes.string,
  refreshCollectionListForDelete : React.PropTypes.func,
  refreshCollectionList : React.PropTypes.func,
  idx : React.PropTypes.number,
  connectionId : React.PropTypes.string
};

export default CollectionItemComponent;
