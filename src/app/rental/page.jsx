"use client";

import useAuth from "@/hook/useAuth";
import { useEffect, useState } from "react";

export default function RentalPage() {
  const { loading } = useAuth("admin");

  const [form, setForm] = useState({
    carId: "",
    customerId: "",
    customerName: "",
    fee: "",
    date: "",
    dueDate: "",
    total: "",
    pointsUsed: "",
    availablePoints: "",
    finalTotal:"",
  });
  const [cars, setCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rentals, setRentals] = useState([]);

  const loadRentals = async () => {
    const res = await fetch("/api/rentals");
    const data = await res.json();
    setRentals(data);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const loadCars = async () => {
    const res = await fetch("/api/cars");
    const data = await res.json();

    const availableCars = data.filter((c) => c.availability === true);

    setCars(availableCars);
  };

  const loadCustomers = async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();

    const mapped = data.map((c) => ({
      id: c.id,
      customerId: c.customer_id,
      name: c.customer_name,
      rewardPoints: c.reward_points || 0,
    }));

    setCustomers(mapped);
  };

  const calculateTotal = (fee, startDate, endDate) => {
    if (!fee || !startDate || !endDate) return "";

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < start) return ""; // ป้องกันวันที่ผิด

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    return (Number(fee) * diffDays).toFixed(2);
  };

  const handleOK = async () => {
    if (!form.carId || !form.customerId || !form.date || !form.dueDate) {
      alert("Please fill all required fields");
      return;
    }

    // หา car.id
    const selectedCar = cars.find((c) => c.id == form.carId);
    if (!selectedCar) return alert("Car not found");

    // หา customer.id (primary key)
    const selectedCustomer = customers.find(
      (c) => c.customerId === form.customerId
    );
    if (!selectedCustomer) return alert("Customer not found");

    const pointUsed = Number(form.pointsToUse) || 0;
    const finalAmt = Number(form.finalTotal) || Number(form.total);

    const payload = {
      car_id: selectedCar.id,
      customer_id: selectedCustomer.id, // ⭐ ใช้ PK
      rental_fee: Number(form.fee),
      rental_date: form.date,
      due_date: form.dueDate,
      total_amount: finalAmt,
      points_used: pointUsed,
      discountAmount: pointUsed,
    };

    const res = await fetch("/api/rentals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (res.ok) {
      alert("Rental saved!");
      await loadRentals();
      await loadCars();
      await loadCustomers();
      handleCancel();
    } else {
      alert(result.error);
    }
  };

  const handleCancel = () => {
    setForm({
      carId: "",
      customerId: "",
      customerName: "",
      fee: "",
      date: "",
      dueDate: "",
      total: "",
      pointsToUse: "",
      availablePoints: "",
      finalTotal:"",
    });
  };

  useEffect(() => {
    loadRentals();
    loadCars();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (!form.carId) return;

    const selectedCar = cars.find((c) => c.id == form.carId);

    if (selectedCar) {
      setForm((prev) => ({
        ...prev,
        fee: selectedCar.rent_fee,
      }));
    }
  }, [form.carId]);

  useEffect(() => {
    if (!form.customerId) {
      setForm((prev) => ({ ...prev, customerName: "" , availablePoints: 0, pointsToUse: ""}));
      return;
    }

    const selected = customers.find((c) => c.customerId === form.customerId);

    if (selected) {
      setForm((prev) => ({
        ...prev,
        customerName: selected.name,
        availablePoints: selected.rewardPoints,
        pointsToUse: "",
      }));
    }
  }, [form.customerId, customers]);

 useEffect(() => {
    const totalBeforeDiscount = calculateTotal(form.fee, form.date, form.dueDate);
    const discount = Number(form.pointsToUse) || 0;

    let finalValue = "";
    if (totalBeforeDiscount) {
      finalValue = Math.max(0, Number(totalBeforeDiscount) - discount).toFixed(2);
    }

    setForm((prev) => {
      // Only update if something actually changed to avoid loop
      if (prev.total === totalBeforeDiscount && prev.finalTotal === finalValue) return prev;
      return {
        ...prev,
        total: totalBeforeDiscount,
        finalTotal: finalValue,
      };
    });
  }, [form.fee, form.date, form.dueDate, form.pointsToUse]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10 px-10">
      <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-700 mb-8">Rental</h2>

        <div className="space-y-6">
          {/* Car ID */}
          <Field label="Car ID">
            <select
              name="carId"
              value={form.carId}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">Select Car</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.car_reg_no}
                </option>
              ))}
            </select>
          </Field>

          {/* Customer ID */}
          <Field label="Customer ID">
            <select
              name="customerId"
              value={form.customerId}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Customer</option>

              {customers.map((c) => (
                <option key={c.id} value={c.customerId}>
                  {c.customerId}
                </option>
              ))}
            </select>
          </Field>

          {/* Customer Name */}
          <Field label="Customer Name">
            <div className="flex items-center gap-4">
              <input
                name="customerName"
                value={form.customerName}
                onChange={handleChange}
                className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-600"
                disabled
              />
              {form.customerId && (
                <div className="text-sm font-semibold text-emerald-600 whitespace-nowrap">
                  ⭐ Points: {form.availablePoints}
                </div>
              )}
            </div>
          </Field>

          {/* Rental Fee */}
          <Field label="Rental Fee">
            <input
              name="fee"
              value={form.fee}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-700  focus:ring-2 focus:ring-blue-400"
              disabled
            />
          </Field>

          {/* Date */}
          <Field label="Date">
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400"
            />
          </Field>

          {/* Due Date */}
          <Field label="Due Date">
            <input
              type="date"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400"
            />
          </Field>

           {/* Use Points */}
          <Field label={`Use Points (Max: ${form.availablePoints})`}>
            <input
              type="number"
              name="pointsToUse"
              value={form.pointsToUse}
              onChange={(e) => {
                let val = Number(e.target.value);
                if (val < 0) val = 0;
                if (val > form.availablePoints) val = form.availablePoints;
                if (form.total && val > Number(form.total)) val = Number(form.total);
                setForm((prev) => ({ ...prev, pointsToUse: val || "" }));
              }}
              min="0"
              max={form.availablePoints}
              placeholder="0"
              className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400"
            />
          </Field>

          {/* Final Total */}
          <Field label="Final Total (After Discount)">
            <input
              name="finalTotal"
              value={form.finalTotal}
              readOnly
              className="w-full rounded-md px-3 py-2 bg-blue-50 text-blue-700 font-bold border border-blue-200 cursor-not-allowed"
            />
          </Field>


          {/* BUTTONS */}
          <div className="flex gap-4 pt-4">
            <button
              className="px-5 py-2 rounded-lg bg-blue-500 text-white shadow hover:bg-blue-600 transition"
              onClick={handleOK}
            >
              OK
            </button>

            <button
              className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 shadow hover:bg-gray-300 transition"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          CarRent Information
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
                        src={rental.customers.img_url || "/default_user.png"}
                        className="rounded-full w-5 h-5"
                      />
                      <p>{rental.customers.customer_id}</p>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 items-center">
                      <img
                        src={rental.cars.img_url || "/default_car.png"}
                        className="w-10 h-5 object-cover rounded-md"
                      />
                      <p>{rental.cars.car_reg_no}</p>
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
                    No returned cars yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
