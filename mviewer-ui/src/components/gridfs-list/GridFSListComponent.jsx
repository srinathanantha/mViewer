import React from 'react';
import GridFSListStyles from '../shared/list-panel.css';
import $ from 'jquery';
import GridFSItem from './GridFSItemComponent.jsx';
import NewBucket from '../new-bucket/NewBucketComponent.jsx';
import SearchInput, {createFilter} from 'react-search-input';
import service from '../../gateway/service.js';
import ReactHeight from 'react-height';

class GridFSList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      gridfs : [],
      connectionId : this.props.propps.connectionId,
      dbStats : {},
      selectedDB : this.props.selectedDB,
      visible : false,
      selectedItem : null,
      loading : 'Loading',
      selectedCollection : null,
      searchTerm : '',
      viewMore : false,
      viewMoreLink : false
    };
  }

  success(calledFrom, data) {
    if(calledFrom === 'refreshCollectionList') {
      if(typeof(data.response.result) != 'undefined') {
        this.setState({gridfs : data.response.result});
      }
      if(typeof(data.response.error) != 'undefined') {
        if(data.response.error.code === 'DB_DOES_NOT_EXISTS') {
          this.props.refreshDb();
        }
      }
    }

    if(calledFrom === 'componentWillMount') {
      this.setState({gridfs : data.response.result});
    }

    if(calledFrom === 'componentWillReceiveProps') {
      this.setState({gridfs : data.response.result});
    }
  }

  failure() {

  }


  clickHandler (idx, fs) {
    this.setState({selectedCollection : idx});
    this.setState({ visible : false});
    this.props.setStates(fs, '', 'gridFs');
    this.setState({selectedCollection : fs}, function() {
    });
  }

  refreshRespectiveData(newCollectionName) {
    this.setState({selectedCollection : newCollectionName});
    this.props.setStates(newCollectionName, '', 'gridFs');
  }

  searchUpdated (term) {
    this.setState({searchTerm : term});
  }

  refreshCollectionList(db) {
    const partialUrl = db + '/gridfs?connectionId=' + this.state.connectionId;
    const gridFSListCall = service('GET', partialUrl, '');
    gridFSListCall.then(this.success.bind(this, 'refreshCollectionList'), this.failure.bind(this, 'refreshCollectionList'));
  }

  componentWillMount() {
    const partialUrl = this.props.selectedDB + '/gridfs?connectionId=' + this.state.connectionId;
    const gridFSListCall = service('GET', partialUrl, '');
    gridFSListCall.then(this.success.bind(this, 'componentWillMount'), this.failure.bind(this, 'componentWillMount'));
  }

  componentWillReceiveProps(nextProps) {
    if(this.state.gridfs && this.state.gridfs.length < 1) {
      const partialUrl = nextProps.selectedDB + '/gridfs?connectionId=' + this.state.connectionId;
      const gridFSListCall = service('GET', partialUrl, '');
      gridFSListCall.then(this.success.bind(this, 'componentWillReceiveProps'), this.failure.bind(this, 'componentWillReceiveProps'));
    }
  }

  setViewMore(height) {
    const gridListHeight = $('.gridContainer').height();
    const listContainerHeight = height;

    if (listContainerHeight >= gridListHeight) {
      this.setState({viewMoreLink : true});
    } else {
      this.setState({viewMoreLink : false});
    }
  }

  gridMoreClick() {
    this.setState({viewMore : !this.state.viewMore});
    this.setState({viewMoreLink : false});
  }

  render () {
    const that = this;
    let items = null;
    let filteredData = null;
    if (typeof(this.state.gridfs) != 'undefined') {
      filteredData = this.state.gridfs.filter(createFilter(this.state.searchTerm));
      items = filteredData.map(function (item, idx) {
        return <GridFSItem
                key={item}
                name={item}
                dbName={this.state.selectedDB}
                onClick={this.clickHandler.bind(this, idx, item)}
                isSelected={that.state.selectedCollection === item}
                connectionId={this.state.connectionId}
                refreshCollectionList={this.refreshCollectionList.bind(this)}
                />;
      }.bind(this));
    }
    return (
        <div className={GridFSListStyles.menu + ' col-md-2 col-xs-5 col-sm-3'} key = {this.props.visible}>
          <div className={(this.props.visible ? (this.state.visible ? GridFSListStyles.visible : this.props.alignment) : this.props.alignment ) }>
            <SearchInput className={GridFSListStyles.searchInput} onChange={this.searchUpdated.bind(this)} />
            <h5 className={GridFSListStyles.menuTitle}><NewBucket gridList= {this.state.gridfs} currentDb={this.props.selectedDB} currentItem="fs" connectionId={this.state.connectionId} refreshCollectionList={this.refreshCollectionList.bind(this)} refreshRespectiveData={this.refreshRespectiveData.bind(this)}></NewBucket></h5>
            <div className = {(this.state.viewMore ? GridFSListStyles.gridListBody : GridFSListStyles.gridListBodyExpanded) + ' gridContainer'}>
              <ReactHeight onHeightReady={this.setViewMore.bind(this)}>
                {items}
              </ReactHeight>
            </div>
            <div className= {(this.state.viewMoreLink ? GridFSListStyles.viewMoreContainer : GridFSListStyles.displayNone)}>
              <a className = {GridFSListStyles.viewMore} onClick={this.gridMoreClick.bind(this)}>List All</a>
            </div>
          </div>
        </div>
    );
  }
}

GridFSList.propTypes = {
  propps : React.PropTypes.object,
  connectionId : React.PropTypes.string,
  selectedDB : React.PropTypes.string,
  refreshDb : React.PropTypes.func,
  visible : React.PropTypes.bool,
  alignment : React.PropTypes.string,
  setStates : React.PropTypes.func
};

export default GridFSList;
