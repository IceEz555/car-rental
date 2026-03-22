import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PUT(req, { params }) {
  const { id } = await params;

  const body = await req.json();

  const rentalStatus = body.rental_status;
  const finalTotalAmount = body.total_amount_after_fine || 0;

  // Calculate points to add if rental is completed and total amount exceeds $100
  let pointsEarned = 0;
  if(rentalStatus === "RETURNED" || rentalStatus === "COMPLETED") {
    pointsEarned = Math.floor(finalTotalAmount / 100) * 10; // Earn 10 points for every $100 spent
  }

  const { data, error } = await supabaseAdmin
    .from("car_rentals")
    .update({
      return_date: body.actual_return_date,
      days_elapsed: body.days_elapsed,
      fine_amount: body.fine_amount,
      final_total_amount: finalTotalAmount,
      rental_status: rentalStatus,
      points_earned: pointsEarned,
    })
    .eq("rental_id", id)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Add points to customer add save history if points were earned
  if (pointsEarned > 0 && data) {
    const customerId = data.customer_id;

    // Get current points
    const {data: customerData} =  await supabaseAdmin
      .from("customers")
      .select("reward_points")
      .eq("id", customerId)
      .single();

    const currentPoints = customerData.reward_points || 0;
    const newPoints = currentPoints + pointsEarned;

    await supabaseAdmin
      .from("customers")
      .update({ reward_points: newPoints })
      .eq("id", customerId);

    await supabaseAdmin
      .from("point_transactions")
      .insert({
        customer_id: customerId,
        rental_id: id,
        transaction_type: "EARNED",
        points: pointsEarned,
        description: `Earned for rental #${id}`,
      });
  }

  return Response.json(data);
}
