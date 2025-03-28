import React from "react";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  inputPage,
  setInputPage,
  handlePageJump,
}) => {
  return (
    <div className="flex items-center justify-center mt-4">
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => {
        if (
          page === 1 ||
          page === totalPages ||
          (page >= currentPage - 1 && page <= currentPage + 1)
        ) {
          return (
            <button
              type="button"
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-2 py-1 text-gray-300 w-6 h-6 flex items-center justify-center rounded mr-2 ${
                currentPage === page ? "font-bold bg-dark-1200 bg-opacity-30" : ""
              }`}
            >
              {page}
            </button>
          );
        }
        if (page === 2 && currentPage > 3) {
          return <span key={page}>...</span>;
        }
        if (page === totalPages - 1 && currentPage < totalPages - 2) {
          return <span key={page}>...</span>;
        }
        return null;
      })}
      <p className="text-gray-1400 text-sm mr-1.5 ml-10">Go to</p>
      <input
        className="w-[42px] h-[22px] bg-dark-100 border border-dark-1250 text-sm text-center border rounded"
        type="text"
        value={inputPage}
        onChange={(e) => {
          const { value } = e.target;
          if (value === "" || (Number.isInteger(Number(value)) && !value.includes("."))) {
            setInputPage(value);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handlePageJump(Number(inputPage));
          }
        }}
      />
    </div>
  );
};

export default Pagination;
