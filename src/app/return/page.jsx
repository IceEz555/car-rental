"use client";

import useAuth from "@/hook/useAuth";
import { useEffect, useState } from "react";

export default function ReturnCarPage() {
  const { loading } = useAuth("admin");
  const [rentals, setRentals] = useState([]);
  const [form, setForm] = useState({
    rentalId: "",
    carId: "",
    customerId: "",
    date: "",
    daysElapsed: "",
    fine: "",
    totalAmount: "",
  });

  const loadRentals = async () => {
    const res = await fetch("/api/rentals");
    const data = await res.json();
    setRentals(data);
  };

  const handleSelectRental = (rentalId) => {
    const selected = rentals.find((r) => r.rental_id == rentalId);
    if (!selected) return;

    setForm({
      rentalId: selected.rental_id,
      carId: selected.cars.car_reg_no,
      customerId: selected.customers.customer_id,
      date: "",
      daysElapsed: "",
      fine: "",
      totalAmount: "",
      rentalStartDate: selected.rental_start_date,
      rentalDueDate: selected.rental_due_date,
      rentalFee: selected.rental_daily_fee,
    });
  };

  useEffect(() => {
    if (!form.date || !form.rentalDueDate) return;

    const returnDate = new Date(form.date);
    const dueDate = new Date(form.rentalDueDate);

    const diffDays = Math.floor((returnDate - dueDate) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      setForm((prev) => ({
        ...prev,
        daysElapsed: 0,
        fine: 0,
        totalAmount: prev.rentalFee, // ค่าเช่าเดิม
      }));
      return;
    }

    const fine = diffDays * Number(form.rentalFee);

    setForm((prev) => ({
      ...prev,
      daysElapsed: diffDays,
      fine: fine,
      totalAmount: Number(prev.rentalFee) + fine,
    }));
  }, [form.date]);

  useEffect(() => {
    loadRentals();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleOk = async () => {
    if (!form.rentalId || !form.date) return;

    const payload = {
      actual_return_date: form.date,
      days_elapsed: Number(form.daysElapsed),
      fine_amount: Number(form.fine),
      total_amount_after_fine: Number(form.totalAmount),
      rental_status: "RETURNED",
    };

    const res = await fetch(`/api/rentals/${form.rentalId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json()
      alert(`Update Failed ${err.error || res.statusText}`)
      return;
    }

    alert("Car returned succesfully! Reward points earned")
    await loadRentals();

    setForm({
      rentalId: "",
      carId: "",
      customerId: "",
      date: "",
      daysElapsed: "",
      fine: "",
      totalAmount: "",
    });
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Checking authentication...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-10 px-10">
      {/* LEFT: FORM */}
      <div className="bg-white shadow-sm rounded-xl p-8 border border-gray-100">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Return Car
        </h2>

        <div className="space-y-4">
          <Field label="Car Id">
            <input
              name="carId"
              value={form.carId}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </Field>

          <Field label="Customer Id">
            <input
              name="customerId"
              value={form.customerId}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </Field>

          <Field label="Actual Return Date">
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full rounded-md px-3 py-2 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </Field>

          <Field label="Days Elapsed">
            <input
              name="daysElapsed"
              value={form.daysElapsed}
              disabled
              className="w-full rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </Field>

          <Field label="Fine">
            <input
              name="fine"
              value={form.fine}
              disabled
              className="w-full rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </Field>

          <Field label="Total Amount">
            <input
              name="totalAmount"
              value={form.totalAmount}
              disabled
              className="w-full rounded-md px-3 py-2 bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </Field>

          {/* BUTTONS */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handleOk}
              className="px-5 py-2 rounded-lg bg-blue-500 text-white shadow-sm hover:bg-blue-600 active:bg-blue-700 transition"
            >
              OK
            </button>
            <button
              onClick={() =>
                setForm({
                  carId: "",
                  customerId: "",
                  date: "",
                  daysElapsed: "",
                  fine: "",
                  totalAmount: "",
                })
              }
              className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 shadow-sm hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT: TABLE */}
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
                <th className="px-3 py-2 text-left font-medium">Due Date</th>
                <th className="px-3 py-2 text-left font-medium">Elapsed</th>
                <th className="px-3 py-2 text-left font-medium">Fine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rentals.map((rental, i) => (
                <tr
                  key={i}
                  className="hover:bg-gray-50"
                  onClick={() => handleSelectRental(rental.rental_id)}
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
                  <td className="px-3 py-2">{rental.rental_due_date}</td>
                  <td className="px-3 py-2">
                    {rental.rental_status === "RETURNED"
                      ? rental.days_elapsed
                      : "Not returned yet"}
                  </td>
                  <td className="px-3 py-2">
                    {rental.rental_status === "RETURNED"
                      ? rental.fine_amount
                      : "Not returned yet"}
                  </td>
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
