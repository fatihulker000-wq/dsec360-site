"use client";

import { Edit, Trash2, Plus } from "lucide-react";
import { EmergencyPlan } from "../types";

type Props = {
    data: EmergencyPlan[];
    onAdd: () => void;
    onEdit: (plan: EmergencyPlan) => void;
    onDelete: (plan: EmergencyPlan) => void;
};

export default function ActionPlanTable({
    data,
    onAdd,
    onEdit,
    onDelete,
}: Props) {

    return (
        <div className="rounded-2xl border bg-white shadow-sm">

            <div className="flex items-center justify-between p-5 border-b">

                <h2 className="text-lg font-bold">
                    Acil Durum Eylem Planları
                </h2>

                <button
                    onClick={onAdd}
                    className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-white"
                >
                    <Plus size={17}/>
                    Yeni Plan
                </button>

            </div>

            <table className="w-full">

                <thead>

                    <tr className="border-b bg-slate-50">

                        <th className="p-3 text-left">Plan</th>
                        <th className="p-3 text-left">İşyeri</th>
                        <th className="p-3 text-left">Revizyon</th>
                        <th className="p-3 text-left">Geçerlilik</th>
                        <th className="p-3 text-center">İşlem</th>

                    </tr>

                </thead>

                <tbody>

                    {data.map(plan=>(

                        <tr
                            key={plan.id}
                            className="border-b hover:bg-slate-50"
                        >

                            <td className="p-3">

                                {plan.planTitle}

                            </td>

                            <td className="p-3">

                                {plan.workplaceTitle}

                            </td>

                            <td className="p-3">

                                {plan.revisionNo}

                            </td>

                            <td className="p-3">

                                {plan.validUntilMillis
                                    ? new Date(plan.validUntilMillis).toLocaleDateString("tr-TR")
                                    : "-"}

                            </td>

                            <td className="p-3">

                                <div className="flex justify-center gap-3">

                                    <button
                                        onClick={()=>onEdit(plan)}
                                    >
                                        <Edit size={18}/>
                                    </button>

                                    <button
                                        onClick={()=>onDelete(plan)}
                                    >
                                        <Trash2
                                            size={18}
                                            className="text-red-600"
                                        />
                                    </button>

                                </div>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>
    );

}