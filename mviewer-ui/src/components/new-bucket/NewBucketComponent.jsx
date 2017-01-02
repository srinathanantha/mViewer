import React from 'react';
import newBucketStyles from './new-bucket.css';
import sharedStyles from '../shared/list-panel.css';
import $ from 'jquery';
import Modal from 'react-modal';
import { Form } from 'formsy-react';
/*eslint-disable */
import progress from '../shared/jquery.ajax-progress.jsx';
/*eslint-enable */
import TextInput from '../text-input/TextInputComponent.jsx';
import Line from 'rc-progress/lib/Line.js';
import newFileStyles from '../new-file/new-file.css';
import 'rc-progress/assets/index.less';
import FileInput from 'react-file-input';
import service from '../../gateway/service.js';
import privilegesAPI from '../../gateway/privileges-api.js';
import AuthPopUp from '../auth-popup/AuthPopUpComponent.jsx';

class NewBucketComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      modalIsOpen : false,
      autoIndex : true,
      name : null,
      size : '',
      max : '',
      error : false,
      title : '',
      submitted : false,
      message : '',
      successMessage : false,
      newBucket : null,
      uploadClick : false,
      count : 0,
      disableSubmit : true,
      newFile : [],
      errorFile : false,
      showAuth : false
    };
  }

  openModal() {
    this.setState({modalIsOpen : true});
    this.setState({message : ''});
    this.setState({disableSubmit : true});
    this.setState({newBucket : null});
    const hasPriv = privilegesAPI.hasPrivilege('insert', '', this.props.currentDb);
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

  closeModal() {
    this.setState({modalIsOpen : false});
    this.setState({newFile : []});
    this.setState({uploadClick : false});
    this.setState({error : false});
    this.setState({errorFile : false});
    this.setState({count : 0});
    if(this.state.successMessage === true) {
      this.props.refreshCollectionList(this.props.currentDb);
      this.props.refreshRespectiveData(this.state.newBucket);
    }
  }

  handleChanged(event) {
    this.setState({disableSubmit : false});
    let newArray = this.state.newFile.slice();
    newArray.push(event.target.files[0]);
    this.setState({newFile : newArray});
    this.setState({errorFile : false});
    event.target.value = null;
  }

  handleChange = () => {
    this.setState({successMessage : false});
    this.setState({message : ''});
  }

  fileUpload(data) {
    const that = this;
    let fd = new FormData();
    fd.append( 'files', data );
    const partialUrl = this.props.currentDb + '/gridfs/' + that.state.newBucket + '/uploadfile?connectionId=' + this.props.connectionId;
    const newBucketCall = service('POST', partialUrl, fd, 'fileUpload', data);
    newBucketCall.then(this.success.bind(this), this.failure.bind(this));
  }

  success(data) {
    if (data.response && data.response.error) {
      if (data.response.error.code === 'ANY_OTHER_EXCEPTION') {
        this.setState({successMessage : false});
        this.setState({disableSubmit : false});
        this.setState({count : 0 });
        this.setState({message : 'File cannot be added some error.'});
      }
    } else {
      this.setState({count : this.state.count + 1 });
    }
    if(this.state.count === this.state.newFile.length) {
      this.setState({successMessage : true});
      setTimeout(() => {
        this.setState({message : 'New Bucket ' + this.state.newBucket + ' is successfully created'});
      }, 2000);
      setTimeout(() => {
        this.closeModal();
      }, 3000);
    }
  }

  failure() {
    this.setState({disableSubmit : false});
  }

  addHandle() {
    const that = this;
    const data = $('form').serialize().split('&');
    let obj = {};
    for(let key in data) {
      obj[data[key].split('=')[0]] = data[key].split('=')[1];
    }
    if ((obj['newBucket'] !== '' && obj['newBucket'] != null) && this.state.newFile.length > 0) {
      let isDuplicate = false;
      this.props.gridList.map(function(item) {
        if(item === obj['newBucket']) {
          isDuplicate = true;
        }
      });
      this.setState({newBucket : obj['newBucket']}, function() {
        if(!isDuplicate) {
          this.setState({uploadClick : true});
          this.setState({disableSubmit : true});
          this.state.newFile.map(function(item) {
            item.percent = 0;
            that.fileUpload(item);
          });
        } else {
          this.setState({successMessage : false});
          this.setState({count : 0 });
          this.setState({message : 'Bucket ' + obj['newBucket'] + ' already exists'});
        }
      });
    }
    if(obj['newBucket'] !== '' || obj['newBucket'] != null) {
      this.setState({error : true});
    }

    if(this.state.newFile.length <= 0) {
      this.setState({errorFile : true});
    }
  }

  componentDidMount() {
    this.setState({name : this.props.currentItem});
    this.setState({title : 'Add GridFS Bucket'});
  }

  removeFile(index) {
    return function() {
      let files = [];
      this.state.newFile.map(function(item, idx) {
        if(idx !== index)
          files.push(item);
      });
      this.setState({newFile : files});
      if(this.state.newFile.length > 0) {
        this.setState({disableSubmit : false});
      } else {
        this.setState({disableSubmit : true});
      }
    }.bind(this);
  }

  render () {
    const that = this;
    let selectedFiles = Object.keys(that.state.newFile).map(function (item, idx) {
      let sizeKB = Math.round((that.state.newFile[item].size / 1024) * 100 ) / 100 ;
      return <div key={item} className={newBucketStyles.selectedFiles}>
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
                  <span><i className={'fa fa-remove ' + sharedStyles.removeIcon} aria-hidden="true"></i></span>
                : null}
              </div>
             </div>;
    }.bind(this));

    const customStyles = {
      content : {
        top : '50%',
        overflow : 'hidden',
        left : '50%',
        padding : '0px',
        right : 'auto',
        border : 'none',
        borderRadius : '4px',
        width : '28%',
        minWidth : '347px',
        bottom : 'auto',
        marginRight : '-50%',
        transform : 'translate(-50%, -50%)'
      },
      overlay : {
        backgroundColor : 'rgba(0,0,0, 0.74902)'
      }
    };

    return(
      <div>
        <span onClick= {this.openModal.bind(this)} className={newBucketStyles.newBucket}><i className="fa fa-plus-circle" aria-hidden="true"></i> Add GridFS Bucket</span>
        { !this.state.showAuth ? <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal.bind(this)}
          style = {customStyles}>
          <div className={newBucketStyles.two}>
            <div className={newBucketStyles.header}>
              <span className={newBucketStyles.text}>{this.state.title}</span>
            </div>
            <Form method='POST'>
              <div className={newBucketStyles.div1}>
                <div className = {newBucketStyles.textDiv}>
                  <TextInput className={newBucketStyles.input} type="text" name="newBucket" id="newBucket" placeholder="Bucket Name" value={this.state.newBucket} validations={'isRequired2:' + this.state.error + ',isAlpha1:' + this.state.error + ',maxLength:' + (95 - this.props.currentDb.length)} onChange={this.handleChange.bind(that)} validationErrors={{isRequired2 : 'Bucket name must not be empty', isAlpha1 : 'Invalid Bucket name', maxLength : 'Bucket size cannot be more than ' + (95 - this.props.currentDb.length) + ' characters for this Db' }} />
                </div>
                <div className={selectedFiles.length > 0 ? newFileStyles.fileDiv : ''}>
                { selectedFiles.length <= 0 ?
                  <span>
                    <img src={'/images/add.png'} className={newBucketStyles.logo}></img>
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
                      <span className={newBucketStyles.addMore}>ADD MORE FILES</span>
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
              <div className={newBucketStyles.buttons}>
                <button onClick={this.addHandle.bind(that)} disabled= {this.state.disableSubmit} className={newBucketStyles.submit}>SUBMIT</button>
                <span onClick={this.closeModal.bind(that)} className={newBucketStyles.cancel}>CANCEL</span>
              </div>
              <div className = {newBucketStyles.clear}></div>
              <div className={!this.state.successMessage ? (newBucketStyles.errorMessage + ' ' + (this.state.message !== '' ? newBucketStyles.show : newBucketStyles.hidden)) : (this.state.message !== '' ? newBucketStyles.successMessage : '')}>{this.state.message}</div>
            </Form>

          </div>
        </Modal> : <AuthPopUp modalIsOpen = {this.state.showAuth} action = 'add bucket' authClose = {this.authClose.bind(this)} ></AuthPopUp> }
      </div>
    );
  }
}

NewBucketComponent.propTypes = {
  currentItem : React.PropTypes.string,
  gridList : React.PropTypes.array,
  map : React.PropTypes.string,
  currentDb : React.PropTypes.string,
  refreshCollectionList : React.PropTypes.func,
  refreshRespectiveData : React.PropTypes.func,
  connectionId : React.PropTypes.string,
  length : React.PropTypes.string
};

export default NewBucketComponent;
