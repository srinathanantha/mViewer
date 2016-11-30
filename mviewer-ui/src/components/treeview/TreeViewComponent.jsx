import React from 'react'
import treeViewStyles from './treeview.css'
import $ from 'jquery'
import TreeView from '../../../dependencies/react-json-tree'
import DeleteComponent from '../deletecomponent/DeleteComponent.jsx'
import privilegesAPI from '../../gateway/privilegesAPI.js';
import AuthPopUp from '../authpopup/AuthPopUpComponent.jsx'
import service from '../../gateway/service.js'

class TreeViewComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      message: '',
      uId: '',
      showAuth: false,
      hasPriv: false
    }
  }
  openModal(id) {
    this.setState({modalIsOpen: true});
    this.setState({message: ''});
    this.setState({uId: id});
    var hasPriv = privilegesAPI.hasPrivilege('remove',this.props.currentItem, this.props.currentDb);
    if(hasPriv){
      this.setState({showAuth : false});    }
    else{
      this.setState({showAuth : true});
    }
  }

  downloadCall(id) {
    var partialUrl = this.props.currentDb+'/gridfs/' + this.props.currentItem + '/getfile?id=' + id +'&download=true&connectionId='+this.props.connectionId;
    service('', partialUrl, '', 'download');
  }

  authClose(){
      this.setState({showAuth:false});
      this.setState({modalIsOpen:false});
  }

  closeModal(successMessage) {
    this.setState({modalIsOpen: false});
    if (successMessage == true){
      this.props.refresh('delete');
    }
  }


 render () {
   var items = this.props.collectionObjects.map(function (collection, i) {
     const getItemString = (type, data, itemType, itemString) => (<span></span>);
     return(
     <div className={treeViewStyles.innerContainer +' '+ treeViewStyles.clearfix} key={collection._id}>
       <span className={treeViewStyles.deleteButton}>
         <i className="fa fa-trash" aria-hidden="true" onClick={this.openModal.bind(this,collection._id)}></i>
       </span>
       { this.props.queryType != "collection" ?
         <span className={treeViewStyles.downloadButton}>
           <i className="fa fa-download" aria-hidden="true" onClick={this.downloadCall.bind(this,collection._id)}></i>
         </span>: null }
       <form method='DELETE'></form>
         <TreeView data={collection} shouldExpandNode={() => false } keyPath ={this.props.queryType == "collection" ? ['Document '+i] : ['File '+i]} key = {collection._id} getItemString={getItemString}/>
     </div>)
   }.bind(this));
   return (
     <div className={treeViewStyles.container}>
       <span className={treeViewStyles.headContainer}>
         <span className={treeViewStyles.key}>Key</span> <span className={treeViewStyles.value}>Value</span>
       </span>
       {this.state.modalIsOpen?( !this.state.showAuth ? <DeleteComponent modalIsOpen={this.state.modalIsOpen} closeModal={this.closeModal.bind(this)} title = {this.props.queryType == "collection" ? 'document' : 'file'} dbName = {this.props.currentDb} collectionName = {this.props.currentItem} connectionId={this.props.connectionId} uId= {this.state.uId} ></DeleteComponent> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose.bind(this)} action =  {this.props.queryType == "collection" ? 'drop document' : 'drop file'} ></AuthPopUp>): ''}
       {items.length>0 ? items : <span className={treeViewStyles.exceptionContainer}>No Records to be displayed</span>}
     </div>
   );
 }
}

export default TreeViewComponent;
