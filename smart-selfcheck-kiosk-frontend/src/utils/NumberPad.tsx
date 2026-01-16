export default function NumberPad({ }) {
  const numbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [null, "0", "⌫"], // Using null for an empty space or you could put a "Clear" button
  ];

  return (
    <div className="bg-[#34495e] p-[20px] rounded-[25px] mt-[30px] w-fit mx-auto shadow-2xl">
      <div className="flex flex-col gap-[12px]">
        {numbers.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-[12px] justify-center">
            {row.map((key, colIndex) => {
              // If the key is null, render an empty div to maintain the grid shape
              if (key === null) {
                return <div key={colIndex} className="min-w-[70px]" />;
              }

              return (
                <button
                  key={key}
                  className="bg-gray-200 hover:bg-white active:scale-95 border-none px-6 py-5 rounded-xl text-[28px] min-w-[85px] font-bold cursor-pointer transition-all duration-100 text-[#2c3e50] shadow-md"
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}