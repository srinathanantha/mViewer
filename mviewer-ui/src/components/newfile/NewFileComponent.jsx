import React from 'react'
import newFileStyles from './newfile.css'
import newBucketStyles from '../newbucket/newBucket.css'
import $ from 'jquery'
import Modal from 'react-modal'
import { Form } from 'formsy-react';
import TextInput from '../TextInput/TextInputComponent.jsx'
import FileInput from 'react-file-input';
import sharedStyles from '../shared/listpanel.css'
import progress from '../shared/jquery.ajax-progress.jsx'
import Line from 'rc-progress/lib/Line.js'
import 'rc-progress/assets/index.less'
import service from '../../gateway/service.js'
import privilegesAPI from '../../gateway/privilegesAPI.js';
import AuthPopUp from '../authpopup/AuthPopUpComponent.jsx'

class newFileComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen: false,
      name: null,
      canSubmit:false,
      title:'',
      submitted:false,
      message:'',
      successMessage: false,
      newFile: [],
      uploadClick: false,
      count: 0,
      disableSubmit: true,
      showAuth: false,
      hasPriv: false
    }
  }

  openModal() {
    this.setState({modalIsOpen: true});
    this.setState({message: ''});
    this.setState({disableSubmit: true});
    this.setState({successMessage: false});

    var hasPriv = privilegesAPI.hasPrivilege('insert','', this.props.currentDb);
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

  closeModal() {
    this.setState({modalIsOpen: false});
    this.setState({newFile: []});
    this.setState({uploadClick: false});
    this.setState({count: 0});
    if(this.state.successMessage==true)
    {
      this.props.refresh('new');
    }
  }

  enableButton() {
    return function() {
      this.setState({
        canSubmit: true
      });
    }.bind(this);
  }

  disableButton() {
    return function() {
      this.setState({
        canSubmit: false
      });
    }.bind(this);
  }

  handleChanged(event){
    var newArray = this.state.newFile.slice();
    newArray.push(event.target.files[0]);
    this.setState({newFile : newArray});
    this.setState({disableSubmit: false});
    event.target.value = null;
  }

  fileUpload(data) {
    var that = this;
    var fd = new FormData();
    fd.append( 'files', data );
    var partialUrl = this.props.currentDb+'/gridfs/'+this.props.currentItem+'/uploadfile?connectionId='+this.props.connectionId;
    var newFileCall = service('POST', partialUrl, fd, 'fileUpload' , data);
    newFileCall.then(this.success.bind(this), this.failure.bind(this));
  }

  removeFile(index) {
    return function() {
      var files = [];
      this.state.newFile.map(function(item, idx){
        if(idx != index)
          files.push(item);
      });
      this.setState({newFile: files});
      if(this.state.newFile.length > 0){
        this.setState({disableSubmit: false});
      } else {
        this.setState({disableSubmit: true});
      }
    }.bind(this);
  }

  success(data) {
    if (data.response && data.response.error) {
      if (data.response.error.code === 'ANY_OTHER_EXCEPTION'){
        this.setState({successMessage:false});
        this.setState({count : 0 })
        this.setState({message: "File cannot be added some error."});
        this.setState({disableSubmit: false});
      }
    } else {
      this.setState({count : this.state.count +1 })
    }
    if(this.state.count == this.state.newFile.length) {
      this.setState({successMessage:true});
      setTimeout(function() { this.setState({message: "File(s) successfully added to bucket " + this.props.currentItem})}.bind(this), 2000);
      setTimeout(function() { this.closeModal() }.bind(this), 3000);
    }
  }

  failure() {
    this.setState({disableSubmit: false});
  }

  uploadHandle(){
    this.setState({uploadClick: true});
    this.setState({disableSubmit: true});
    var that = this;
    this.state.newFile.map(function(item){
      item.percent = 0;
      that.fileUpload(item);
    });
  }

  componentDidMount(){
    this.setState({name :this.props.currentItem});
    this.setState({title:'File Upload'});
  }

  componentDidUpdate() {
    $("input[name='myfile_filename']").value = "";
  }

  completeLoading() {
    this.setState({completeLoading: true});
  }

  startLoading() {
    this.setState({startLoading: true});
  }

  resetLoading() {

  }

  render () {
    var that = this;
    var selectedFiles = null;
    var count = 0;
    var selectedFiles = Object.keys(that.state.newFile).map(function (item, idx) {
      ++count
      var sizeKB = Math.round((that.state.newFile[item].size / 1024) * 100 ) / 100 ;
      return <div key={item} className={newFileStyles.selectedFiles}>
              <div key={item} className={newFileStyles.eachFile}>
                <span className={newFileStyles.name}>{this.state.newFile[item].name}</span>
                <span>({sizeKB}Kb) </span>
                <span id={this.state.newFile[item].name}></span>
                { this.state.uploadClick ?
                  <Line percent={this.state.newFile[item].percent} strokeWidth="4" strokeColor={this.state.color} className={newFileStyles.lineProgress}/>
                  : <span className={newBucketStyles.removeFileDiv}>
                      <span onClick= {this.removeFile(idx)}><i className="fa fa-remove" aria-hidden="true"></i></span>
                    </span>
                }
                <span>{item.success}</span>
                { item.added ?
                  <span><i className={"fa fa-remove " +  sharedStyles.removeIcon} aria-hidden="true"></i></span>
                : null}
              </div>
             </div>
      }.bind(this));

    const customStyles = {
      content : {
        top                   : '50%',
        left                  : '50%',
        overflow              : 'hidden',
        border                : 'none',
        borderRadius          : '4px',
        right                 : 'auto',
        width                 : '25%',
        minWidth              : '310px',
        padding               : '0px',
        bottom                : 'auto',
        marginRight           : '-50%',
        transform             : 'translate(-50%, -50%)'
      },
      overlay : {
        backgroundColor       : 'rgba(0,0,0, 0.74902)'
      }
    };

    return(
      <div>
       <span className={newFileStyles.addButton} onClick= {this.openModal.bind(this)} ><i className="fa fa-plus-circle" aria-hidden="true"></i> Add File(s)</span>
       {!this.state.showAuth ? <Modal
         isOpen={this.state.modalIsOpen}
         onRequestClose={this.closeModal.bind(this)}
         style = {customStyles}>
          <div className={newFileStyles.two}>
            <div className={newFileStyles.header}>
              <span className={newFileStyles.text}>{this.state.title}</span>
            </div>
            <Form method='POST'>
              <div>
                <div className={selectedFiles.length > 0 ? newFileStyles.fileDiv: ''}>
                { selectedFiles.length <= 0 ?
                  <span>
                    <img src={'./images/Add.png'} className={newBucketStyles.logo}></img>
                    <span className={newBucketStyles.addLabel}>Click here to upload files</span>
                    <div className={newBucketStyles.addFileDiv}>
                      <FileInput name="files"
                         placeholder="Add files.."
                         className={selectedFiles.length > 0 ? newBucketStyles.addFileHidden : newBucketStyles.addFile}
                         onChange={this.handleChanged.bind(that)}
                         value={this.state.inputValue}/>
                      </div>
                  </span>
                 : <span>
                      { selectedFiles }
                   </span> }
                </div>
                <div>
                 { selectedFiles.length > 0 ?
                    <div className={newBucketStyles.addMoreFileDiv}>
                      <span className={newFileStyles.addMore}>ADD MORE FILES</span>
                      <FileInput name="files"
                         placeholder="Add files.."
                         className={newBucketStyles.addMoreFile}
                         onChange={this.handleChanged.bind(that)}
                         value={this.state.inputValue}/>
                    </div> : null }
                 { this.state.errorFile ?
                  <div className={newBucketStyles.errorFile}>Please select alteast one file.</div>
                  : null}
                </div>
              </div>

              <div className={newFileStyles.buttons}>
               <span onClick={this.closeModal.bind(that)} className={ newFileStyles.cancel }>CANCEL</span>
               <button onClick={this.uploadHandle.bind(that)} disabled= {this.state.disableSubmit} className={newFileStyles.submit}>UPLOAD</button>
              </div>
            </Form>
            <div className={newFileStyles.clear}></div>
            <div className={!this.state.successMessage? (newFileStyles.errorMessage + ' ' + (this.state.message!='' ? newFileStyles.show : newFileStyles.hidden)) : (this.state.message != '' ? newFileStyles.successMessage : '')}>{this.state.message}</div>
          </div>
       </Modal> : <AuthPopUp modalIsOpen = {this.state.showAuth} action = 'add file'   authClose = {this.authClose.bind(this)} ></AuthPopUp> }
      </div>
    );
  }
}

export default newFileComponent;
