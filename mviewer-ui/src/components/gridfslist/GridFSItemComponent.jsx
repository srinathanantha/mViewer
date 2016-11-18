import React from 'react'
import GridFSListStyles from '../shared/listpanel.css'
import $ from 'jquery'
class GridFSItemComponent extends React.Component {

 constructor(props) {
   super(props);
   this.state = {
     hover_flag: false
   }
  }

  render () {
    return (
      <div className={(this.props.isSelected ? GridFSListStyles.menuItem +' ' +GridFSListStyles.highlight :GridFSListStyles.menuItem)} key={this.props.name} onClick={this.props.onClick} value={this.props.name} >
        <span className={GridFSListStyles.collectionIcon}>
          <i className="fa fa-file" aria-hidden="true"></i>
        </span>
        <span id="toolTip" className = {GridFSListStyles.button}>{this.props.name}</span>
      </div>
    );
  }
}
GridFSItemComponent.getDefaultProps = {
  isSelected: false
}
GridFSItemComponent.propTypes = {
  onClick: React.PropTypes.func.isRequired,
  isSelected: React.PropTypes.bool
}

export default GridFSItemComponent;
