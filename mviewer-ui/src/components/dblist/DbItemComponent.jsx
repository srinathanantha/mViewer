import React from 'react'
import dbListStyles from './dblist.css'
import $ from 'jquery'
import DeleteComponent from '../deletecomponent/DeleteComponent.jsx'
import privilegesAPI from '../../gateway/privilegesAPI.js';
import AuthPopUp from '../authpopup/AuthPopUpComponent.jsx';
import toolTip from '../shared/tooltip.js';

class DbItemComponent extends React.Component {

 constructor(props) {
    super(props);
    this.state = {
      hover_flag: false,
      modalIsOpen: false,
      _isMounted: false,
      showAuth: false,
      hasPriv: false
    }
  }

  openModal(e) {
    e.stopPropagation();
    this.setState({modalIsOpen: true});
    this.setState({message: ''});
    var hasPriv = privilegesAPI.hasPrivilege('dropDatabase','', this.props.name);
    if(hasPriv){
      this.setState({showAuth : false});    }
    else{
      this.setState({showAuth : true});
    }

  }

  authClose(){
      this.setState({showAuth:false});
      this.setState({modalIsOpen:false});
  }

  closeModal(successMessage) {
    if(this.state._isMounted == true){
      this.setState({modalIsOpen: false});
      if(successMessage == true){
        this.props.refreshDbList('undefined');
      }
    }
  }

  componentDidMount(){
    this.state._isMounted = true;
  }

  componentWillUnmount(){
    this.state._isMounted = false;
  }


  render () {
    return (
      <div onClick={this.props.onClick} value={this.props.name} className={(this.props.isSelected ? dbListStyles.menuItem +' ' +dbListStyles.highlight :dbListStyles.menuItem)} key={this.props.name} >
          <span className={dbListStyles.dbIcon}>
            <i className="fa fa-database" aria-hidden="true"></i>
          </span>
          <span id="toolTipDb" className={dbListStyles.content} title = {this.props.name}>{this.props.name}</span>
          <i className={"fa fa-trash " +  dbListStyles.removeIcon} aria-hidden="true" onClick={this.openModal.bind(this)}></i>
        {this.state.modalIsOpen?( !this.state.showAuth ? <DeleteComponent modalIsOpen={this.state.modalIsOpen} closeModal={this.closeModal.bind(this)} title = 'database' dbName = {this.props.name} connectionId={this.props.connectionId} ></DeleteComponent>  : <AuthPopUp modalIsOpen = {this.state.showAuth}  authClose = {this.authClose.bind(this)} action = 'drop database' ></AuthPopUp>) : ''}        
      </div>
    );
  }
}

DbItemComponent.getDefaultProps = {
  isSelected: false
}
DbItemComponent.propTypes = {
  onClick: React.PropTypes.func.isRequired,
  isSelected: React.PropTypes.bool
}

export default DbItemComponent;
