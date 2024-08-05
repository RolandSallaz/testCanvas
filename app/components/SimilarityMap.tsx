"use client";
import { Canvas, Circle, Line } from "fabric";
import { useEffect, useRef, useState } from "react";

const PAGE_SIZE = 100;

const getColorBasedOnValue = (value: number, maxValue: number) => {
  const ratio = value / maxValue;
  const red = Math.floor(255 * ratio);
  const blue = Math.floor(255 * (1 - ratio));
  return `rgb(${red}, 0, ${blue})`;
};

export default function SimilarityMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [page, setPage] = useState(1);
  const [songsData, setSongsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredSong, setHoveredSong] = useState<string | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  const fetchData = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/songs?page=${page}&pageSize=${PAGE_SIZE}`
      );
      const data = await response.json();
      setSongsData((prevData) => [...prevData, ...data]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) {
      console.error("Canvas element is null");
      return;
    }

    const fabricCanvas = new Canvas(canvasElement);

    fabricCanvas.clear();

    const maxPopularity = Math.max(
      ...songsData.map((song) => song["Spotify Popularity"])
    );
    const maxSimilarity = 100;

    const circles: Circle[] = [];
    const circlePositions: { [key: string]: { x: number; y: number } } = {};

    songsData.forEach((song) => {
      const x = Math.random() * canvasElement.width;
      const y = Math.random() * canvasElement.height;
      const radius = Math.sqrt(song["Spotify Popularity"]) / 2;
      const color = getColorBasedOnValue(
        song["Spotify Popularity"],
        maxPopularity
      );

      const circle = new Circle({
        radius,
        fill: color,
        left: x - radius,
        top: y - radius,
        selectable: false,
        hasControls: false,
        hoverCursor: "pointer",
        id: song["ISRC"],
        data: song,
      });

      circle.on("mouseover", (e) => {
        const target = e.target as Circle;
        if (target) {
          const song = target.data as any;
          setHoveredSong(`${song["Track"]} by ${song["Artist"]}`);
          setTooltipStyle({
            position: "absolute",
            left: e.e.clientX + 10,
            top: e.e.clientY + 10,
            backgroundColor: "white",
            border: "1px solid black",
            padding: "5px",
            borderRadius: "3px",
            pointerEvents: "none",
            zIndex: 1000,
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          });
        }
      });

      circle.on("mouseout", () => {
        setHoveredSong(null);
      });

      fabricCanvas.add(circle);
      circles.push(circle);
      circlePositions[song["Track"]] = { x, y };
    });

    songsData.forEach((song, index) => {
      const startCircle = circles[index];
      if (index < songsData.length - 1) {
        const endCircle = circles[index + 1];
        const similarity = Math.random() * maxSimilarity;
        const color = getColorBasedOnValue(similarity, maxSimilarity);
        const line = new Line(
          [
            startCircle.left + startCircle.radius,
            startCircle.top + startCircle.radius,
            endCircle.left + endCircle.radius,
            endCircle.top + endCircle.radius,
          ],
          {
            stroke: color,
            strokeWidth: 2,
            selectable: false,
            evented: false,
          }
        );
        fabricCanvas.add(line);
      }
    });

    fabricCanvas.on("mouse:wheel", (opt) => {
      const delta = opt.e.deltaY;
      fabricCanvas.setZoom(fabricCanvas.getZoom() * (1 + delta / 1000));
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    return () => {
      fabricCanvas.dispose();
    };
  }, [songsData]);

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: "1px solid black" }}
      />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <button onClick={handleLoadMore}>
          Песен на странице {page * PAGE_SIZE} Загрузить еще
        </button>
      )}
      {hoveredSong && <div style={tooltipStyle}>{hoveredSong}</div>}
    </div>
  );
}
