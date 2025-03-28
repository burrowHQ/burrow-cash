import styled from "styled-components";
import React, { useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";
import CustomPagination from "./CustomPagination";
import CustomTableMobile from "./CustomTableMobile";
import { isMobileDevice } from "../../helpers/helpers";

type columnType = {
  id?: string;
  header: any;
  accessorKey?: string;
  cell?: any;
  size?: number;
  minSize?: number;
  maxSize?: number;
};

interface Props {
  columns: Array<columnType>;
  data: Array<any>;
  actionRow?: React.ReactNode;
  className?: string;
  fetchData?: () => any;
  pagination?: {
    totalItems?: number;
    totalPages?: number;
    page?: number;
    onNextClick?: () => any;
    onPrevClick?: () => any;
  };
  setPagination?: any;
  isLoading?: boolean;
  noDataText?: string;
  onSelectRow?: (data: object | null | undefined, index: number | null | undefined) => unknown;
  selectedRowIndex?: number | null | undefined;
}

const CustomTable = ({
  columns,
  data,
  actionRow,
  className,
  fetchData,
  pagination,
  setPagination,
  isLoading,
  noDataText,
  onSelectRow,
  selectedRowIndex,
}: Props) => {
  const isMobile = isMobileDevice();
  const headersRef = useRef<any>([]);
  const [dimensions, setDimensions] = React.useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const handleResize = () => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  React.useEffect(() => {
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleFirstClick = () => {
    if (setPagination) {
      setPagination((d) => ({
        ...d,
        page: 1,
      }));
    }
  };

  const handleLastClick = () => {
    if (setPagination && pagination?.totalPages) {
      setPagination((d) => ({
        ...d,
        page: pagination.totalPages,
      }));
    }
  };

  const handlePrevClick = () => {
    if (setPagination) {
      setPagination((d) => ({
        ...d,
        page: d?.page <= 1 ? 1 : d.page - 1,
      }));
    }
  };

  const handleNextClick = () => {
    if (setPagination) {
      setPagination((d) => ({
        ...d,
        page: pagination?.page ? pagination.page + 1 : 1,
      }));
    }
  };

  const handleRowEnter = (rowData, rowIndex) => {
    if (typeof onSelectRow === "function" && selectedRowIndex !== rowIndex) {
      onSelectRow(rowData, rowIndex);
    }
  };
  if (isMobile) {
    return (
      <>
        <CustomTableMobile
          columns={columns}
          data={data}
          isLoading={isLoading}
          noDataText={noDataText}
        />
        {pagination?.totalPages && pagination?.page ? (
          <div className="custom-table-pagination flex justify-end mt-2">
            <CustomPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              prevClick={handlePrevClick}
              nextClick={handleNextClick}
              firstClick={handleFirstClick}
              lastClick={handleLastClick}
            />
          </div>
        ) : null}
      </>
    );
  }

  const headers = columns?.map((d) => {
    let text;
    if (typeof d.header === "function") {
      text = d.header();
    } else {
      text = d.header;
    }
    return { text, size: d.size, minSize: d.minSize, maxSize: d.maxSize };
  });

  const headersWidth = headersRef.current.map((d) => d?.getBoundingClientRect()?.width);
  const headerNode = (
    <div className="custom-table-tr custom-table-header-row">
      {headers?.map((d, i) => {
        const styles: { flex?: string; maxWidth?: string; minWidth?: string } = {};
        if (d.size) {
          styles.flex = `0 0 ${d.size}px`;
        }
        if (d.minSize) {
          styles.minWidth = `${d.minSize}px`;
        }
        if (d.maxSize) {
          styles.maxWidth = `${d.maxSize}px`;
        }
        const keyId = typeof d.text === "string" ? d.text : i;

        const assignRef = (el) => {
          headersRef.current[i] = el;
        };
        return (
          <div key={keyId} className="custom-table-th text-gray-180" style={styles} ref={assignRef}>
            {d.text}
          </div>
        );
      })}
    </div>
  );

  let bodyNodes;
  if (data?.length) {
    bodyNodes = data?.map((d, i) => {
      const tdNode = columns?.map((col, colIndex) => {
        let content = null;
        if (typeof col.cell === "function") {
          content = col.cell({
            originalData: d,
          });
        } else if (col.accessorKey) {
          content = d[col.accessorKey];
        }
        const styles: { flex?: string } = {};
        const colSize = col.size || headersWidth[colIndex];
        if (colSize) {
          styles.flex = `0 0 ${colSize}px`;
        }
        return (
          <div className="custom-table-td" key={col.id || col.header} style={styles}>
            {content}
          </div>
        );
      });
      return (
        <div
          className={twMerge("custom-table-row", actionRow && "table-row-hover")}
          key={i}
          onMouseEnter={() => handleRowEnter(d, i)}
        >
          <div className="custom-table-tr">{tdNode}</div>
          {actionRow && <div className="custom-table-action">{actionRow}</div>}
        </div>
      );
    });
  } else if (!isLoading) {
    bodyNodes = (
      <div className="flex justify-center items-center text-gray-160" style={{ height: 300 }}>
        {noDataText || "No Data"}
      </div>
    );
  }

  return (
    <StyledTable className={twMerge("custom-table", className)}>
      <StyledLoading active={!!isLoading}>Loading</StyledLoading>
      <div className="custom-table-thead">{headerNode}</div>
      <div className="custom-table-tbody">{bodyNodes}</div>
      {pagination?.totalPages && pagination?.page ? (
        <div className="custom-table-pagination flex justify-end mt-2">
          <CustomPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            prevClick={handlePrevClick}
            nextClick={handleNextClick}
            firstClick={handleFirstClick}
            lastClick={handleLastClick}
          />
        </div>
      ) : null}
    </StyledTable>
  );
};

const StyledLoading = styled.div<{ active: boolean | undefined }>`
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  z-index: ${(p) => (p.active ? 22 : -1)};
  opacity: ${(p) => (p.active ? 1 : 0)};
  pointer-events: ${(p) => (p.active ? "all" : "none")};
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledTable = styled.div`
  width: 100%;
  font-size: 14px;
  font-weight: 400;

  .custom-table-tr {
    display: flex;
  }

  .custom-table-th,
  .custom-table-td {
    flex: 1;
    word-break: break-word;
  }

  .custom-table-thead {
    border-bottom: 1px solid #303037;

    .custom-table-th {
      text-align: left;
      padding: 10px 5px 10px 0;
    }
  }

  .custom-table-tbody {
    min-height: 85px;

    .custom-table-td {
      padding: 15px 5px 15px 0;
      justify-content: center;
      display: flex;
      flex-direction: column;
    }
  }

  .custom-table-action {
    display: none;
    height: 0;
    overflow: hidden;
    transition: all ease-in-out 0.5ms;
    opacity: 0;
  }

  .custom-table-row {
    &.table-row-hover:hover {
      background: #25252c;
    }
    &:hover {
      .custom-table-action {
        display: block;
        height: auto;
        opacity: 1;
      }
    }
  }
`;
CustomTable.displayName = "CustomTable";
export default CustomTable;
