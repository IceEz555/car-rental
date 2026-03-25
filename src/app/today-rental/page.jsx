"use client";

import useAuth from "@/hook/useAuth";
import { useEffect, useState } from "react";

export default function TodayRental() {
  const { loading } = useAuth("admin");
  const [selectedDate, setSelectDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [cars, setCars] = useState([]);
  const [rentals, setRentals] = useState([]);

  const loadRentals = async () => {
    const res = await fetch("/api/rentals");
    const data = await res.json();
    setRentals(data);
  };

  const loadCars = async () => {
    const res = await fetch("/api/cars");
    const data = await res.json();

    const availableCars = data.filter((c) => c.availability === true);

    setCars(availableCars);
  };

  const pickUpToday = rentals.filter((r) => r.rental_start_date === selectedDate);

  const returnToday = rentals.filter((r) => r.rental_due_date === selectedDate);

  const rentingToday = rentals.filter(
    (r) => r.rental_start_date <= selectedDate && r.rental_due_date >= selectedDate,
  );

  const availableToday = cars.length - rentingToday.length;

  const totalSalesToday = pickUpToday.reduce(
    (sum, r) => sum + Number(r.rental_total_amount || 0),
    0,
  );

  const totalCars = cars.length;

  const todayRentals = rentals.filter(
    (r) => r.rental_start_date === selectedDate || r.rental_due_date === selectedDate,
  );

  useEffect(() => {
    loadRentals();
    loadCars();
  }, []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Checking authentication...
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10 px-10">
        <div className="flex flex-col gap-5 ">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-2xl font-semibold text-gray-700">Daily Rental</h2>
              <input type="date"  value={selectedDate} 
              onChange={(e) => setSelectDate(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-1.5 text-sm text-gray-700 focus:outline-none 
              focus:ring-2 focus:ring-blue bg-white shadow-sm cursor-pointer"/>
          </div>

          <div className="flex items-center justify-center gap-4 w-full ">
            {/* Total Cars */}
            <div className="bg-gray-100 rounded-xl p-4 text-center w-35 h-30">
              <p className="text-sm text-gray-600">Total Cars</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{totalCars}</p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-center w-35 h-30">
              <p className="text-sm text-blue-700">Pick Up</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {pickUpToday.length}
              </p>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 text-center w-35 h-30">
              <p className="text-sm text-indigo-700">Available</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {availableToday}
              </p>
            </div>

            <div className="bg-green-50 rounded-xl p-4 text-center  w-35 h-30">
              <p className="text-sm text-green-700">Return</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {returnToday.length}
              </p>
            </div>
          </div>

          <div className="bg-gray-900 rounded-xl p-4 text-center  w-full h-30">
            <p className="text-sm text-gray-300">Sales Today</p>
            <p className="text-3xl font-bold text-white mt-2">
              ฿{totalSalesToday.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 mt-1">From today pick-ups</p>
          </div>
        </div>
        
        <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Today Rental
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="px-3 py-2 text-left font-medium">CustID</th>
                  <th className="px-3 py-2 text-left font-medium">CarID</th>
                  <th className="px-3 py-2 text-left font-medium">Start Date</th>
                  <th className="px-3 py-2 text-left font-medium">Due Date</th>
                  <th className="px-3 py-2 text-left font-medium">Rent Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayRentals.map((rental, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">
                      <div className="flex gap-1 items-center">
                        <img
                          src={rental.customers?.img_url || "/default_user.png"}
                          className="rounded-full w-5 h-5"
                          alt="user"
                        />
                        <p>{rental.customers?.customer_id}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 items-center">
                        <img
                          src={rental.cars?.img_url || "/default_car.png"}
                          className="w-10 h-5 object-cover rounded-md"
                          alt="car"
                        />
                        <p>{rental.cars?.car_reg_no}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">{rental.rental_start_date}</td>
                    <td className="px-3 py-2">{rental.rental_due_date}</td>
                    <td className="px-3 py-2">{rental.rental_total_amount}</td>
                  </tr>
                ))}
                {todayRentals.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-gray-400"
                    >
                      No rental yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Rental History
      <div className="mt-10 mb-10 px-10">
        <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Rental History
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-700">
                  <th className="px-3 py-2 text-left font-medium">CustID</th>
                  <th className="px-3 py-2 text-left font-medium">CarID</th>
                  <th className="px-3 py-2 text-left font-medium">Start Date</th>
                  <th className="px-3 py-2 text-left font-medium">Due Date</th>
                  <th className="px-3 py-2 text-left font-medium">Rent Fee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rentals.map((rental, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-3 py-2">
                      <div className="flex gap-1 items-center">
                        <img
                          src={rental.customers?.img_url || "/default_user.png"}
                          className="rounded-full w-5 h-5"
                          alt="user"
                        />
                        <p>{rental.customers?.customer_id}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 items-center">
                        <img
                          src={rental.cars?.img_url || "/default_car.png"}
                          className="w-10 h-5 object-cover rounded-md"
                          alt="car"
                        />
                        <p>{rental.cars?.car_reg_no}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2">{rental.rental_start_date}</td>
                    <td className="px-3 py-2">{rental.rental_due_date}</td>
                    <td className="px-3 py-2">{rental.rental_total_amount}</td>
                  </tr>
                ))}
                {rentals.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-gray-400"
                    >
                      No rental history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div> */}
      
    </>
  );
}
