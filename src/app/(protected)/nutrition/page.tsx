'use client'

import { getNutritions, Nutrition } from "@/actions/nutritions";
import { useFirebase } from "@/firebase/firebaseConfig";
import { useEffect, useState } from "react";

interface dietResponse {
  patientId: string;
  nutrition: Nutrition;
}

const CreateDietPage = () => {
  const [profile, setProfile] = useState<any[]>([]);
  const [diets, setDiets] = useState<dietResponse[] | null>(null);
  const [expandedDietIndex, setExpandedDietIndex] = useState<number | null>(null);
  const { addNutritionToDb, loggedInUser, getNutritionsByPatientId,fetchUserProfile, fetchAllInfoRecords } = useFirebase();
  const [loading, setLoading] = useState<boolean>(false);

  const fetchDiets = async () => {
    const res = await getNutritionsByPatientId(loggedInUser?.uid as string);
    setDiets(res);
  }

  useEffect(() => {
      const loadData = async () => {
        const data = await fetchAllInfoRecords(
          loggedInUser?.uid as string
        );
        const userProfile = await fetchUserProfile(
          loggedInUser?.uid as string
        ); // You'll need to implement this
        // console.log("userrrr", userProfile);
        if (userProfile) {
          setProfile(userProfile);
        }
      };
  
      loadData();
    }, []);

  useEffect(() => {
    fetchDiets();
  }, [])

  const dietGenerator = async () => {
    setLoading(true);
    try {
      const { success, nutrition } = await getNutritions({
        age: profile?.age,
        height: profile?.height,
        weight: profile?.weight,
        gender: profile?.gender,
      });

      const res = await addNutritionToDb({
        patientId: loggedInUser?.uid as string,
        nutrition
      });

      if (res.success && success) {
        await fetchDiets(); // Refresh the list after adding new diet
      }
    } catch (error) {
      console.error('Failed to generate the diet', error);
    }
    finally {
      setLoading(false);
    }
  }

  const toggleExpandDiet = (index: number) => {
    setExpandedDietIndex(expandedDietIndex === index ? null : index);
  }

  const formatMacros = (nutrition: Nutrition) => {
    return `P: ${nutrition.macronutrients.protein_g}g · C: ${nutrition.macronutrients.carbs_g}g · F: ${nutrition.macronutrients.fats_g}g`;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Nutrition Plans</h1>
        <button
          disabled={loading}
          onClick={dietGenerator}
          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          {loading ? "Generating new Diet" : "Generate New Diet"}
        </button>
      </div>

      {diets === null ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading your nutrition plans...</p>
        </div>
      ) : diets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No nutrition plans found. Generate your first plan!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {diets.map((diet, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 transition-all"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Nutrition Plan #{index + 1}
                    </h3>
                    <p className="text-gray-500 mt-1">
                      {diet.nutrition.total_calories_per_day.toLocaleString()} kcal/day
                    </p>
                  </div>
                  <button
                    onClick={() => toggleExpandDiet(index)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {expandedDietIndex === index ? 'Hide Details' : 'View Details'}
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                    {formatMacros(diet.nutrition)}
                  </span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full">
                    {diet.nutrition.water_intake_liters}L water
                  </span>
                  <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full">
                    {diet.nutrition.meals.length} meals
                  </span>
                </div>

                {expandedDietIndex === index && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="font-medium text-gray-700 mb-3">Daily Meals</h4>
                    <div className="grid gap-4">
                      {diet.nutrition.meals.map((meal, mealIndex) => (
                        <div key={mealIndex} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <h5 className="font-medium">{meal.name}</h5>
                              <p className="text-sm text-gray-500">{meal.time}</p>
                            </div>
                            <span className="text-sm font-medium">
                              {meal.calories} kcal
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2">
                            {meal.foods.map((food, foodIndex) => (
                              <div key={foodIndex} className="flex justify-between text-sm">
                                <span>
                                  {food.quantity} {food.name}
                                </span>
                                <span className="text-gray-500">
                                  {food.calories} kcal
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="text-xs font-medium text-gray-500">Vitamin A</h5>
                        <p className="font-medium">{diet.nutrition.micronutrients.vitamin_a_mcg}mcg</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="text-xs font-medium text-gray-500">Vitamin C</h5>
                        <p className="font-medium">{diet.nutrition.micronutrients.vitamin_c_mg}mg</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="text-xs font-medium text-gray-500">Calcium</h5>
                        <p className="font-medium">{diet.nutrition.micronutrients.calcium_mg}mg</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h5 className="text-xs font-medium text-gray-500">Iron</h5>
                        <p className="font-medium">{diet.nutrition.micronutrients.iron_mg}mg</p>
                      </div>
                    </div>

                    {diet.nutrition.notes && (
                      <div className="mt-6 bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                        <h5 className="text-sm font-medium text-yellow-800">Notes</h5>
                        <p className="mt-1 text-sm text-yellow-700">{diet.nutrition.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CreateDietPage