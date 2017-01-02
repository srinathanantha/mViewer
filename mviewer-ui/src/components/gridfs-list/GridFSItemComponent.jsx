import React from 'react';
/*eslint-disable */
import toolTip from '../shared/tool-tip.js';
/*eslint-enable */
import GridFSListStyles from '../shared/list-panel.css';

class GridFSItemComponent extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      hoverFlag : false
    };
  }

  render () {
    return (
      <div className={(this.props.isSelected ? GridFSListStyles.menuItem + ' ' + GridFSListStyles.highlight : GridFSListStyles.menuItem)} key={this.props.name} onClick={this.props.onClick} value={this.props.name} >
        <span className={GridFSListStyles.collectionIcon}>
          <i className="fa fa-file" aria-hidden="true"></i>
        </span>
        <span id="toolTip" className = {GridFSListStyles.button}>{this.props.name}</span>
      </div>
    );
  }
}
GridFSItemComponent.getDefaultProps = {
  isSelected : false
};
GridFSItemComponent.propTypes = {
  onClick : React.PropTypes.func,
  isSelected : React.PropTypes.bool,
  name : React.PropTypes.string
};

export default GridFSItemComponent;
