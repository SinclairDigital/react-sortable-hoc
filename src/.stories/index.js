import React, {Component, PropTypes} from 'react';
import ReactDOM from 'react-dom';
import {storiesOf} from '@kadira/storybook';
import style from './Storybook.scss';
import {
  SortableContainer,
  SortableElement,
  SortableGroup,
  SortableHandle,
  arrayMove,
  moveGroupItems,
} from '../index';
import {
  defaultFlexTableRowRenderer,
  FlexColumn,
  FlexTable,
  VirtualScroll,
} from 'react-virtualized';
import 'react-virtualized/styles.css';
import Infinite from 'react-infinite';
import range from 'lodash/range';
import random from 'lodash/random';
import classNames from 'classnames';

function getItems(count, height, label) {
  var heights = [65, 110, 140, 65, 90, 65];
  return range(count).map(value => {
    return {
      value: label ? label + value : value,
      height: height || heights[random(0, heights.length - 1)],
    };
  });
}

const Handle = SortableHandle(() => <div className={style.handle} />);

const Item = SortableElement(props => {
  return (
    <div
      className={props.className}
      style={{
        height: props.height,
      }}
    >
      {props.shouldUseDragHandle && <Handle />}
      <div className={style.wrapper}>
        <span>Item</span> {props.value}
      </div>
    </div>
  );
});

class ListWrapper extends Component {
  constructor({items}) {
    super();
    this.state = {
      items,
      isSorting: false,
    };
  }
  static propTypes = {
    items: PropTypes.array,
    className: PropTypes.string,
    itemClass: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    onSortStart: PropTypes.func,
    onSortEnd: PropTypes.func,
    component: PropTypes.func,
    shouldUseDragHandle: PropTypes.bool,
  };
  static defaultProps = {
    className: classNames(style.list, style.stylizedList),
    itemClass: classNames(style.item, style.stylizedItem),
    width: 400,
    height: 600,
  };
  onSortStart = () => {
    const {onSortStart} = this.props;
    this.setState({isSorting: true});

    if (onSortStart) {
      onSortStart(this.refs.component);
    }
  };
  onSortEnd = ({oldIndex, newIndex}) => {
    const {onSortEnd} = this.props;
    const {items} = this.state;

    this.setState({
      items: arrayMove(items, oldIndex, newIndex),
      isSorting: false,
    });

    if (onSortEnd) {
      onSortEnd(this.refs.component);
    }
  };
  render() {
    const Component = this.props.component;
    const {items, isSorting} = this.state;
    const props = {
      isSorting,
      items,
      onSortEnd: this.onSortEnd,
      onSortStart: this.onSortStart,
      ref: 'component',
      useDragHandle: this.props.shouldUseDragHandle,
    };

    return <Component {...this.props} {...props} />;
  }
}

class GroupWrapper extends Component {
  state = {
    items: this.props.items,
  };
  static propTypes = {
    items: React.PropTypes.array,
    components: PropTypes.arrayOf(
      React.PropTypes.shape({
        component: PropTypes.func,
        className: PropTypes.string,
        itemClass: PropTypes.string,
      })
    ),
    wrapperClass: PropTypes.string,
  };
  handleMove = movedItems => {
    const {items} = this.state;

    this.setState({
      items: moveGroupItems(items, movedItems),
    });
  };
  render() {
    const {components, wrapperClass} = this.props;
    const {items} = this.state;

    return (
      <SortableGroup items={items} onMove={this.handleMove}>
        {connectGroupTarget => (
          <div className={wrapperClass}>
            {components.map(({Component, ...props}, index) => (
              <Component
                key={index}
                {...props}
                {...connectGroupTarget(index)}
              />
            ))}
          </div>
        )}
      </SortableGroup>
    );
  }
}

class VirtualList extends Component {
  static propTypes = {
    items: PropTypes.array,
    className: PropTypes.string,
    itemClass: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    itemHeight: PropTypes.number,
    sortingIndex: PropTypes.number,
  };
  render() {
    const {
      className,
      items,
      height,
      width,
      itemHeight,
      itemClass,
      sortingIndex,
    } = this.props;

    return (
      <VirtualScroll
        ref="vs"
        className={className}
        rowHeight={({index}) => items[index].height}
        estimatedRowSize={itemHeight}
        rowRenderer={({index}) => {
          const {value, height} = items[index];
          return (
            <Item
              index={index}
              className={itemClass}
              sortingIndex={sortingIndex}
              value={value}
              height={height}
            />
          );
        }}
        rowCount={items.length}
        width={width}
        height={height}
      />
    );
  }
}

const SortableVirtualList = SortableContainer(VirtualList, {withRef: true});
const SortableFlexTable = SortableContainer(FlexTable, {withRef: true});
const SortableRowRenderer = SortableElement(defaultFlexTableRowRenderer);

class FlexTableWrapper extends Component {
  static propTypes = {
    items: PropTypes.array,
    className: PropTypes.string,
    helperClass: PropTypes.string,
    itemClass: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    itemHeight: PropTypes.number,
    onSortEnd: PropTypes.func,
  };
  render() {
    const {
      className,
      height,
      helperClass,
      itemClass,
      itemHeight,
      items,
      onSortEnd,
      width,
    } = this.props;

    return (
      <SortableFlexTable
        getContainer={wrappedInstance =>
          ReactDOM.findDOMNode(wrappedInstance.Grid)}
        gridClassName={className}
        headerHeight={itemHeight}
        height={height}
        helperClass={helperClass}
        onSortEnd={onSortEnd}
        rowClassName={itemClass}
        rowCount={items.length}
        rowGetter={({index}) => items[index]}
        rowHeight={itemHeight}
        rowRenderer={props => <SortableRowRenderer {...props} />}
        width={width}
      >
        <FlexColumn label="Index" dataKey="value" width={100} />
        <FlexColumn label="Height" dataKey="height" width={width - 100} />
      </SortableFlexTable>
    );
  }
}

const SortableInfiniteList = SortableContainer(({
  className,
  items,
  itemClass,
  sortingIndex,
  sortableHandlers,
}) => {
  return (
    <Infinite
      className={className}
      containerHeight={600}
      elementHeight={items.map(({height}) => height)}
      {...sortableHandlers}
    >
      {items.map(({value, height}, index) => (
        <Item
          key={`item-${index}`}
          className={itemClass}
          sortingIndex={sortingIndex}
          index={index}
          value={value}
          height={height}
        />
      ))}
    </Infinite>
  );
});

const SortableList = SortableContainer(({
  className,
  items,
  itemClass,
  sortingIndex,
  shouldUseDragHandle,
  sortableHandlers,
}) => {
  return (
    <div className={className} {...sortableHandlers}>
      {items.map(({value, height}, index) => (
        <Item
          key={`item-${value}`}
          className={itemClass}
          sortingIndex={sortingIndex}
          index={index}
          value={value}
          height={height}
          shouldUseDragHandle={shouldUseDragHandle}
        />
      ))}
    </div>
  );
});

const Category = SortableElement(props => {
  return (
    <div className={style.category}>
      <div className={style.categoryHeader}>
        <Handle />
        <span>Category {props.value}</span>
      </div>
      <ListWrapper
        component={SortableList}
        className={style.categoryList}
        items={getItems(3, 59)}
        shouldUseDragHandle={true}
        helperClass={style.stylizedHelper}
      />
    </div>
  );
});

const ShrinkingSortableList = SortableContainer(({
  className,
  isSorting,
  items,
  itemClass,
  sortingIndex,
  shouldUseDragHandle,
  sortableHandlers,
}) => {
  return (
    <div className={className} {...sortableHandlers}>
      {items.map(({value, height}, index) => (
        <Item
          key={`item-${value}`}
          className={itemClass}
          sortingIndex={sortingIndex}
          index={index}
          value={value}
          height={isSorting ? 20 : height}
          shouldUseDragHandle={shouldUseDragHandle}
        />
      ))}
    </div>
  );
});

const NestedSortableList = SortableContainer(({
  className,
  items,
  sortableHandlers,
}) => {
  return (
    <div className={className} {...sortableHandlers}>
      {items.map((value, index) => (
        <Category key={`category-${value}`} index={index} value={value} />
      ))}
    </div>
  );
});

storiesOf('Basic Configuration', module)
  .add('Basic usage', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          items={getItems(50, 59)}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  })
  .add('Drag handle', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          shouldUseDragHandle={true}
          items={getItems(50, 59)}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  })
  .add('Elements of varying heights', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          items={getItems(50)}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  })
  .add('Elements that shrink', () => {
    const getHelperDimensions = ({node}) => ({
      height: 20,
      width: node.offsetWidth,
    });
    return (
      <div className={style.root}>
        <ListWrapper
          component={ShrinkingSortableList}
          items={getItems(50)}
          helperClass={style.shrinkedHelper}
          getHelperDimensions={getHelperDimensions}
        />
      </div>
    );
  })
  .add('Horizontal', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          axis={'x'}
          items={getItems(50, 300)}
          helperClass={style.stylizedHelper}
          className={classNames(
            style.list,
            style.stylizedList,
            style.horizontalList
          )}
          itemClass={classNames(style.stylizedItem, style.horizontalItem)}
        />
      </div>
    );
  })
  .add('Grid', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          axis={'xy'}
          items={getItems(10, 110)}
          helperClass={style.stylizedHelper}
          className={classNames(style.list, style.stylizedList, style.grid)}
          itemClass={classNames(style.stylizedItem, style.gridItem)}
        />
      </div>
    );
  })
  .add('Nested Lists', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={NestedSortableList}
          items={range(4)}
          shouldUseDragHandle={true}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  });

storiesOf('Advanced', module)
  .add('Press delay (200ms)', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          items={getItems(50, 59)}
          pressDelay={200}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  })
  .add('Lock axis', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          items={getItems(50)}
          helperClass={style.stylizedHelper}
          lockAxis={'y'}
          lockToContainerEdges={true}
          lockOffset={['0%', '100%']}
        />
      </div>
    );
  })
  .add('Window as scroll container', () => {
    return (
      <ListWrapper
        component={SortableList}
        items={getItems(50, 59)}
        className=""
        useWindowAsScrollContainer={true}
        helperClass={style.stylizedHelper}
      />
    );
  });

storiesOf('Grouping', module)
  .add('Vertical', () => {
    const className = classNames(style.list, style.stylizedList);
    const itemClass = classNames(style.item, style.stylizedItem);

    return (
      <GroupWrapper
        items={[
          getItems(5, 59, 'Dog'),
          getItems(5, 59, 'Cat'),
          getItems(5, 59, 'Bird'),
        ]}
        wrapperClass={style.vertGroups}
        components={[
          {Component: SortableList, className, itemClass},
          {Component: SortableList, className, itemClass},
          {Component: SortableList, className, itemClass},
        ]}
      />
    );
  })
  .add('Horizontal', () => {
    const className = classNames(
      style.list,
      style.stylizedList,
      style.horizontalList
    );
    const itemClass = classNames(
      style.item,
      style.stylizedItem,
      style.horizontalItem
    );

    return (
      <GroupWrapper
        items={[
          getItems(5, 300, 'Dog'),
          getItems(5, 300, 'Cat'),
          getItems(5, 300, 'Cat'),
        ]}
        wrapperClass={style.root}
        components={[
          {Component: SortableList, className, itemClass, axis: 'x'},
          {Component: SortableList, className, itemClass, axis: 'x'},
        ]}
      />
    );
  })
  .add('Grid', () => {
    const className = classNames(style.list, style.stylizedList, style.grid);
    const itemClass = classNames(style.stylizedItem, style.gridItem);

    return (
      <GroupWrapper
        items={[getItems(5, 110, 'Dog'), getItems(5, 110, 'Cat')]}
        wrapperClass={style.root}
        components={[
          {Component: SortableList, className, itemClass, axis: 'xy'},
          {Component: SortableList, className, itemClass, axis: 'xy'},
        ]}
      />
    );
  })
  .add('Different Height Containers', () => {
    const classNameA = classNames(style.list, style.stylizedList, style.sizedA);
    const classNameB = classNames(style.list, style.stylizedList, style.sizedB);
    const itemClass = classNames(style.item, style.stylizedItem);

    return (
      <GroupWrapper
        items={[getItems(3, 50, 'Dog'), getItems(3, 50, 'Cat')]}
        wrapperClass={style.root}
        components={[
          {Component: SortableList, className: classNameA, itemClass},
          {Component: SortableList, className: classNameB, itemClass},
        ]}
      />
    );
  })
  .add('Hand Cursor', () => {
    const className = classNames(style.list, style.stylizedList);
    const itemClass = classNames(style.item, style.stylizedItem);
    return (
      <GroupWrapper
        items={[getItems(5, 59, 'Dog'), getItems(5, 59, 'Cat')]}
        wrapperClass={style.vertGroups}
        components={[
          {
            Component: SortableList,
            className,
            useDragHandle: true,
            shouldUseDragHandle: true,
            itemClass,
          },
          {
            Component: SortableList,
            className,
            useDragHandle: true,
            shouldUseDragHandle: true,
            itemClass,
          },
        ]}
      />
    );
  });

storiesOf('Customization', module)
  .add('Minimal styling', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          items={getItems(50)}
          className={style.list}
          itemClass={style.item}
          helperClass={style.helper}
        />
      </div>
    );
  })
  .add('Transition duration', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          items={getItems(50, 59)}
          transitionDuration={450}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  })
  .add('Disable transitions', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableList}
          items={getItems(50, 59)}
          transitionDuration={0}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  });

storiesOf('React Virtualized', module)
  .add('Basic usage', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableVirtualList}
          items={getItems(500, 59)}
          itemHeight={59}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  })
  .add('Elements of varying heights', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableVirtualList}
          items={getItems(500)}
          itemHeight={89}
          helperClass={style.stylizedHelper}
          onSortEnd={ref => {
            // We need to inform React Virtualized that the item heights have changed
            const instance = ref.getWrappedInstance();
            const vs = instance.refs.vs;

            vs.recomputeRowHeights();
            instance.forceUpdate();
          }}
        />
      </div>
    );
  })
  .add('FlexTable usage', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={FlexTableWrapper}
          items={getItems(500, 50)}
          itemHeight={50}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  });

storiesOf('React Infinite', module)
  .add('Basic usage', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableInfiniteList}
          items={getItems(500, 59)}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  })
  .add('Elements of varying heights', () => {
    return (
      <div className={style.root}>
        <ListWrapper
          component={SortableInfiniteList}
          items={getItems(500)}
          helperClass={style.stylizedHelper}
        />
      </div>
    );
  });
