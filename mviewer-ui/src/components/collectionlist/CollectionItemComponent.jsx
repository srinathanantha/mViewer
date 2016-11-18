import React from 'react'
import collectionListStyles from '../shared/listpanel.css'
import sharedStyles from '../shared/listpanel.css'
import toolTip from '../shared/tooltip.js'
import $ from 'jquery'
import DeleteComponent from '../deletecomponent/DeleteComponent.jsx'
import privilegesAPI from '../../gateway/privilegesAPI.js';
import AuthPopUp from '../authpopup/AuthPopUpComponent.jsx'

class CollectionItemComponent extends React.Component {

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

 openModal() {
   this.setState({modalIsOpen: true});
   this.setState({message: ''});
   var hasPriv = privilegesAPI.hasPrivilege('dropCollection',this.props.name, this.props.dbName);
    if(hasPriv && !this.props.name.startsWith("system.")){
      this.setState({showAuth : false});    }
    else{
      this.setState({showAuth : true});
    }
 }

 authClose(){
      this.setState({showAuth:false});
      this.setState({modalIsOpen:false});
  }

 closeModal(successMessage, fromDeleteButton) {
   if(this.state._isMounted == true){
     if(successMessage == true){
       if(fromDeleteButton == 'delete'){

          this.props.refreshCollectionListForDelete(this.props.dbName);
       }
       else {
          this.props.refreshCollectionList(this.props.dbName , false);
       }

     }
     this.setState({modalIsOpen: false});
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
      <div className={(this.props.isSelected ? collectionListStyles.menuItem +' ' +collectionListStyles.highlight :collectionListStyles.menuItem)} key={this.props.name} onClick={this.props.onClick} value={this.props.name} >
        <span className = {collectionListStyles.collectionIcon}>
          <i className="fa fa-files-o" aria-hidden="true"></i>
        </span>
        <span id="toolTip" className = {collectionListStyles.button}>{this.props.name}</span>
        <i className={"fa fa-trash "+ collectionListStyles.trash} aria-hidden="true" onClick = {this.openModal.bind(this)}></i>
        {this.state.modalIsOpen ? ( !this.state.showAuth ?<DeleteComponent modalIsOpen={this.state.modalIsOpen} closeModal={this.closeModal.bind(this)} title = 'collection' dbName = {this.props.dbName} collectionName = {this.props.name} connectionId={this.props.connectionId} ></DeleteComponent> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose.bind(this)} action = 'drop collection' ></AuthPopUp> ) : null}
      </div>
    );
  }

}
CollectionItemComponent.getDefaultProps = {
  isSelected: false
}
CollectionItemComponent.propTypes = {
  onClick: React.PropTypes.func.isRequired,
  isSelected: React.PropTypes.bool
}

export default CollectionItemComponent;
