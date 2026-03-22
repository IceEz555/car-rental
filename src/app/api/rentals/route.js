import { supabaseAdmin } from "../../../lib/supabase-admin";

export async function POST(req) {
  const body = await req.json();

  const pointUsed = body.points_used || 0;
  const discountAmount = body.discountAmount || 0;

  // 1. Check Point customer
  if (pointUsed > 0) {
    const { data: customerData, error: customerError } = await supabaseAdmin
      .from("customers")
      .select("reward_points")
      .eq("id", body.customer_id)
      .single();
    if (customerError) {
      return Response.json({ error: customerError.message }, { status: 400 });
    }
    if ((customerData.reward_points || 0) < pointUsed) {
      return Response.json({ error: "Not enough reward points" }, { status: 400 });
    }
  }

  // 2. Insert rental record
  const { data: rentalData, error: rentalError } = await supabaseAdmin
    .from("car_rentals")
    .insert([
      {
        car_id: body.car_id,
        customer_id: body.customer_id,
        rental_daily_fee: body.rental_fee,
        rental_start_date: body.rental_date,
        rental_due_date: body.due_date,
        rental_total_amount: body.total_amount,
        points_used: pointUsed,
        discount_amount: discountAmount,
      },
    ])
    .select()
    .single();

  if (rentalError) {
    return Response.json({ error: rentalError.message }, { status: 400 });
  }

  // 3. Update customer points
  if (pointUsed > 0 && rentalData) {
    const {data: cData} = await supabaseAdmin
      .from("customers")
      .select("reward_points")
      .eq("id", body.customer_id)
      .single();

    const currentPoints = cData.reward_points || 0;
    const newPoints = currentPoints - pointUsed;

    await supabaseAdmin
      .from("customers")
      .update({ reward_points: newPoints })
      .eq("id", body.customer_id);
  }

    await supabaseAdmin
      .from("point_transactions")
      .insert([
        {
          customer_id: body.customer_id,
          rental_id: rentalData.rental_id,
          transaction_type: "REDEEMED",
          points: -pointUsed,
          description: `Redeemed for rental #${rentalData.rental_id}`,
        },
      ]);

  return Response.json(rentalData);

}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("car_rentals")
    .select(
      `
      rental_id,
      rental_start_date,
      rental_due_date,
      rental_daily_fee,
      rental_total_amount,
      rental_status,
      days_elapsed,
      fine_amount,
      cars (
        id,
        car_reg_no,img_url
      ),
      customers (
        id,
        customer_id,
        customer_name,img_url
      )
    `
    )
    .order("rental_id", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data);
}
