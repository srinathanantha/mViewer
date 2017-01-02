import React from 'react';
import collectionListStyles from '../shared/list-panel.css';
import $ from 'jquery';
import CollectionItem from './CollectionItemComponent.jsx';
import NewCollection from '../new-collection/NewCollectionComponent.jsx';
import SearchInput, {createFilter} from 'react-search-input';
import service from '../../gateway/service.js';
import ReactHeight from 'react-height';

class CollectionList extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      collections : [],
      connectionId : this.props.propps.connectionId,
      dbStats : {},
      selectedDB : this.props.selectedDB,
      visible : false,
      selectedItem : null,
      loading : 'Loading',
      searchTerm : '',
      queryType : JSON.parse(sessionStorage.getItem('queryType') || '{}'),
      selectedCollection : null,
      viewMore : false,
      viewMoreLink : false
    };
    this.searchUpdated = this.searchUpdated.bind(this);
    this.refreshCollectionList = this.refreshCollectionList.bind(this);
    this.refreshRespectiveData = this.refreshRespectiveData.bind(this);
    this.setViewMore = this.setViewMore.bind(this);
    this.clickHandler = this.clickHandler.bind(this);
    this.refreshCollectionListForDelete = this.refreshCollectionListForDelete.bind(this);
    this.collMoreClick = this.collMoreClick.bind(this);
  }

  clickHandler (idx, collection) {
    this.setState({selectedItem : idx});
    this.setState({ visible : false});
    this.props.setStates(collection, '', 'collection');
    this.setState({selectedCollection : collection}, function() {
    });
  }

  refreshRespectiveData(newCollectionName) {
    this.setState({selectedCollection : newCollectionName});
    this.props.setStates(newCollectionName, '', 'collection');
  }

  refreshCollectionList(db) {
    var partialUrl = db + '/collection?connectionId=' + this.state.connectionId;
    var collectionListCall = service('GET', partialUrl, '');
    collectionListCall.then(this.success.bind(this, 'refreshCollectionList'), this.failure.bind(this, 'refreshCollectionList'));
  }

  refreshCollectionListForDelete(db) {
    var partialUrl = db + '/collection?connectionId=' + this.state.connectionId;
    var collectionListCall = service('GET', partialUrl, '');
    collectionListCall.then(this.success.bind(this, 'refreshCollectionListForDelete'), this.failure.bind(this, 'refreshCollectionList'));
  }

  success(calledFrom, data) {
    if(calledFrom === 'componentDidMount') {
      this.setState({collections : data.response.result});
    }

    if(calledFrom === 'componentWillReceiveProps') {
      if (this.state._isMounted === true) {
        this.setState({collections : data.response.result});
      }
    }

    if(calledFrom === 'refreshCollectionList') {
      if(typeof(data.response.result) != 'undefined') {
        if(data.response.result.length !== 0) {
          this.setState({collections : data.response.result});
        } else{
          this.props.refreshDb();
          this.props.closeDbTab();
        }
      }
      if(typeof(data.response.error) != 'undefined') {
        if(data.response.error.code === 'DB_DOES_NOT_EXISTS') {
          this.props.refreshDb();
        }
      }
    }

    if(calledFrom === 'refreshCollectionListForDelete') {
      if(typeof(data.response.result) != 'undefined') {
        if(data.response.result.length !== 0) {
          this.setState({collections : data.response.result});
          this.props.hideQueryExecutor();
        } else{
          this.props.refreshDb();
          this.props.closeDbTab();
        }

      }
      if(typeof(data.response.error) != 'undefined') {
        if(data.response.error.code === 'DB_DOES_NOT_EXISTS') {
          this.props.refreshDb();
          this.props.closeDbTab();
        }
      }

    }
  }

  failure() {

  }

  componentWillMount() {
    this.setState({_isMounted : true});
  }

  componentDidMount() {
    this.setState({_isMounted : true});
    this.setState({selectedDB : this.props.selectedDB});
    let partialUrl = this.props.selectedDB + '/collection?connectionId=' + this.state.connectionId;
    let collectionListCall = service('GET', partialUrl, '');
    collectionListCall.then(this.success.bind(this, 'componentDidMount'), this.failure.bind(this, 'componentDidMount'));
  }

  componentWillReceiveProps(nextProps) {
    if(nextProps.selectedDB !== this.props.selectedDB) {
      this.setState({selectedCollection : null});
    }
    this.setState({selectedDB : nextProps.selectedDB});
  }

  componentWillUnmount() {
    this.setState({_isMounted : false});
  }

  searchUpdated (term) {
    this.setState({searchTerm : term});
  }

  setViewMore(height) {
    var collListHeight = $('.collContainer').height();
    var listContainerHeight = height;

    if (listContainerHeight > collListHeight) {
      this.setState({viewMoreLink : true});
    } else {
      this.setState({viewMoreLink : false});
    }
  }

  collMoreClick() {
    this.setState({viewMore : !this.state.viewMore});
    this.setState({viewMoreLink : false});
  }

  render () {
    var filteredData = null;
    if (typeof(this.state.collections) != 'undefined') {
      filteredData = this.state.collections.filter(createFilter(this.state.searchTerm));
    }


    return (
         <div id ="collectionNav-1" className={collectionListStyles.menu + ' innerList col-md-2 col-xs-5 col-sm-3'} key = {this.props.visible}>
          <div className={(this.props.visible ? (this.state.visible ? collectionListStyles.visible : this.props.alignment) : this.props.alignment ) }>
             <SearchInput className={collectionListStyles.searchInput} onChange={this.searchUpdated} />
             <h5 className={collectionListStyles.menuTitle}><NewCollection queryType= {this.state.queryType} currentDb={this.props.selectedDB} currentItem={''} connectionId={this.props.propps.connectionId} addOrUpdate={'1'} refreshCollectionList={this.refreshCollectionList} refreshRespectiveData={this.refreshRespectiveData}/></h5>
               <div className = {(this.state.viewMore ? collectionListStyles.listBody : collectionListStyles.listBodyExpanded) + ' collContainer'}>
                <ReactHeight onHeightReady={this.setViewMore}>
                  { typeof(this.state.collections) != 'undefined' ?
                     (filteredData.map((item, idx) => {
                       return(
                         <CollectionItem
                          key={item}
                          name={item}
                          idx={idx}
                          dbName={this.state.selectedDB}
                          onClick={this.clickHandler}
                          isSelected={this.state.selectedCollection === item}
                          connectionId={this.state.connectionId}
                          refreshCollectionList={this.refreshCollectionList}
                          refreshCollectionListForDelete={this.refreshCollectionListForDelete}
                         />);
                     })) : null}
                  </ReactHeight>
                </div>
                <div className= {(this.state.viewMoreLink ? collectionListStyles.viewMoreContainer : collectionListStyles.displayNone)}>
                  <a className = {collectionListStyles.viewMore} onClick={this.collMoreClick}> List All</a>
                </div>
            </div>
        </div>
    );
  }
}

CollectionList.propTypes = {
  propps : React.PropTypes.object,
  selectedDB : React.PropTypes.string,
  setStates : React.PropTypes.func,
  refreshDb : React.PropTypes.func,
  closeDbTab : React.PropTypes.func,
  hideQueryExecutor : React.PropTypes.func,
  visible : React.PropTypes.bool,
  alignment : React.PropTypes.string
};

export default CollectionList;
