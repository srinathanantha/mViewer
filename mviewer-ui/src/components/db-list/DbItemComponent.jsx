import React from 'react';
/*eslint-disable */
import toolTip from '../shared/tool-tip.js';
/*eslint-enable */
import dbListStyles from './db-list.css';
import DeleteComponent from '../delete-component/DeleteComponent.jsx';
import privilegesAPI from '../../gateway/privileges-api.js';
import AuthPopUp from '../auth-popup/AuthPopUpComponent.jsx';

class DbItemComponent extends React.Component {

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

  openModal = (e) => {
    e.stopPropagation();
    this.setState({modalIsOpen : true});
    this.setState({message : ''});
    const hasPriv = privilegesAPI.hasPrivilege('dropDatabase', '', this.props.name);
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

  closeModal(successMessage) {
    if(this.state._isMounted === true) {
      this.setState({modalIsOpen : false});
      if(successMessage === true) {
        this.props.refreshDbList('undefined');
      }
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
      <div onClick={this.onClick} value={this.props.name} className={(this.props.isSelected ? dbListStyles.menuItem + ' ' + dbListStyles.highlight : dbListStyles.menuItem)} key={this.props.name} >
          <span className={dbListStyles.dbIcon}>
            <i className="fa fa-database" aria-hidden="true"></i>
          </span>
          <span id="toolTipDb" className={dbListStyles.content} title = {this.props.name}>{this.props.name}</span>
          <i className={'fa fa-trash ' + dbListStyles.removeIcon} aria-hidden="true" onClick={this.openModal}></i>
        {this.state.modalIsOpen ? ( !this.state.showAuth ? <DeleteComponent modalIsOpen={this.state.modalIsOpen} closeModal={this.closeModal} title = 'database' dbName = {this.props.name} connectionId={this.props.connectionId} ></DeleteComponent> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose} action = 'drop database' ></AuthPopUp>) : ''}
      </div>
    );
  }
}

DbItemComponent.getDefaultProps = {
  isSelected : false
};
DbItemComponent.propTypes = {
  onClick : React.PropTypes.func.isRequired,
  isSelected : React.PropTypes.bool,
  name : React.PropTypes.string,
  refreshDbList : React.PropTypes.func,
  idx : React.PropTypes.number,
  connectionId : React.PropTypes.string
};

export default DbItemComponent;
