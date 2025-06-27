import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-bold mb-2">SEA Catering</h1>
      <p className="text-xl mb-6">Healthy Meals, Anytime, Anywhere</p>
      <section className="mb-6 max-w-2xl">
        <p>
          SEA Catering menyediakan layanan meal plan sehat yang dapat dikustomisasi dan diantar ke berbagai kota di Indonesia. Nikmati kemudahan hidup sehat dengan pilihan menu, pengiriman fleksibel, dan info nutrisi lengkap.
        </p>
        <ul className="list-disc ml-6 mt-3">
          <li>Meal plan kustom</li>
          <li>Pengiriman ke seluruh Indonesia</li>
          <li>Info nutrisi lengkap</li>
        </ul>
      </section>
      <section className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold">Contact</h2>
        <p>Manager: Brian</p>
        <p>Phone: 08123456789</p>
      </section>
    </main>
  );
}
