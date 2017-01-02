import React from 'react';
import collectionStatsStyles from './collection-stats.css';
import Modal from 'react-modal';
import service from '../../gateway/service.js';
import AuthPopUp from '../auth-popup/AuthPopUpComponent.jsx';

class CollectionStatsComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      dbNames : [],
      connectionId : this.props.connectionId,
      collectionStats : [],
      selectedDB : null,
      sidebarOpen : false,
      modalIsOpen : false,
      showAuth : false,
      hasPriv : false
    };
  }

  openModal = () => {
    const partialUrl = 'stats/db/' + this.props.selectedDB + '/collection/' + this.props.selectedCollection + '?connectionId=' + this.props.connectionId;

    this.setState({modalIsOpen : true});
    const collectionStatsCall = service('GET', partialUrl, '');
    collectionStatsCall.then(this.success.bind(this), this.failure.bind(this));
  }

  authClose = () => {
    this.setState({showAuth : false});
    this.setState({modalIsOpen : false});
  }

  success(data) {
    if(typeof(data.response.result) != 'undefined') {
      this.setState({showAuth : false});
      this.setState({collectionStats : data.response.result});
    }


    if(typeof(data.response.error) != 'undefined' && data.response.error.code === 'GET_COLL_STATS_EXCEPTION' ) {
      this.setState({showAuth : true});
      this.setState({collectionStats : []});
    }
  }

  failure() {
    this.setState({ message : 'Unexpected Error Occurred' });
  }

  closeModal = () => {
    this.setState({modalIsOpen : false});
  }

  render () {
    return(

      <div className={collectionStatsStyles.mainContainer}>
        <span className={collectionStatsStyles.statsButton} onClick={this.openModal}><i className="fa fa-area-chart" aria-hidden="true"></i>Stats</span>
        { !this.state.showAuth ? <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          className={collectionStatsStyles.modal}>
          <div className={collectionStatsStyles.collectionStats}>
            <div className={collectionStatsStyles.header}>
              <span className={collectionStatsStyles.text}>Statistics</span>
            </div>
          <div className = {collectionStatsStyles.tableBody}>
          <table>
            <tbody>
              <tr>
                <th>Keys</th>
                <th>Values</th>
              </tr>
              {
                 this.state.collectionStats.map((db) => {
                   return (<tr key={db.Key}><td>{db.Key}</td><td>{db.Value}</td></tr>);
                 })
            }
            </tbody>
          </table>
          </div>
          </div>
    </Modal> : <AuthPopUp modalIsOpen = {this.state.showAuth} authClose = {this.authClose} action = 'view collection stats' ></AuthPopUp> }
  </div>
    );
  }
}

CollectionStatsComponent.propTypes = {
  connectionId : React.PropTypes.string,
  selectedDB : React.PropTypes.string,
  selectedCollection : React.PropTypes.string
};

export default CollectionStatsComponent;
