import Image from 'next/image';

interface ServiceDetailHeroProps {
  title: string;
  description: string;
  image: string;
}

export default function ServiceDetailHero({ title, description, image }: ServiceDetailHeroProps) {
  return (
    <section className="relative bg-gradient-to-br from-[#C7A24D] via-[#D97D25] to-[#7FA89A] py-24 lg:py-32">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="container relative mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {title}
            </h1>
            <p className="text-lg md:text-xl leading-relaxed text-white/95">
              {description}
            </p>
          </div>
          <div className="relative h-[400px] lg:h-[500px] rounded-xl overflow-hidden shadow-2xl">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
